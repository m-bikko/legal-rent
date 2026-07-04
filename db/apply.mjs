// Применяет SQL-миграции из db/migrations к Supabase Postgres.
// Запуск: node db/apply.mjs (читает .env в корне репо).
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const { Client } = require("pg");

for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m) process.env[m[1]] ??= m[2];
}

const url = process.env.POSTGRES_URL_NON_POOLING.replace(/[?&]sslmode=[^&]*/, "");
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

await client.connect();
await client.query(
  "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
);

const applied = new Set((await client.query("select name from _migrations")).rows.map((r) => r.name));
const files = readdirSync(join(root, "db", "migrations")).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) {
    console.log(`skip    ${file}`);
    continue;
  }
  const sql = readFileSync(join(root, "db", "migrations", file), "utf8");
  await client.query("begin");
  try {
    await client.query(sql);
    await client.query("insert into _migrations (name) values ($1)", [file]);
    await client.query("commit");
    console.log(`applied ${file}`);
  } catch (err) {
    await client.query("rollback");
    console.error(`FAILED  ${file}: ${err.message}`);
    process.exitCode = 1;
    break;
  }
}

await client.end();
