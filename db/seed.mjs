// Демо-данные для RentLegal KZ. Запуск: node db/seed.mjs
// Идемпотентен: пересоздаёт всех seed-пользователей (телефоны +7700000ООXX) с каскадом.
import { readFileSync } from "node:fs";
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
const db = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await db.connect();

const MONTH = (n, from = new Date()) => {
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d;
};

const photo = (seed, i) => `https://picsum.photos/seed/rentlegal-${seed}-${i}/800/600`;
const photos = (seed, n) => Array.from({ length: n }, (_, i) => photo(seed, i + 1));

// ---------- пользователи ----------
const users = [
  // арендодатели (верифицированы)
  { key: "landlord1", phone: "+77000000001", role: "landlord", account_type: "self_employed", full_name: "Данияр Ахметов", city: "almaty", verification_status: "approved" },
  { key: "landlord2", phone: "+77000000002", role: "landlord", account_type: "organization", org_name: 'ТОО "Астана Недвижимость"', iin_bin: "123456789012", city: "astana", verification_status: "approved" },
  // арендаторы
  { key: "tenant1", phone: "+77000000011", role: "tenant", account_type: "individual", full_name: "Айдана Серикова", city: "almaty", verification_status: "none" },
  { key: "tenant2", phone: "+77000000012", role: "tenant", account_type: "individual", full_name: "Мирас Женисов", city: "astana", verification_status: "none" },
  { key: "tenant3", phone: "+77000000013", role: "tenant", account_type: "organization", org_name: 'ТОО "TechComp Kazakhstan"', iin_bin: "987654321098", city: "shymkent", verification_status: "none" },
  { key: "tenant4", phone: "+77000000014", role: "tenant", account_type: "individual", full_name: "Гульнара Оспанова", city: "karaganda", verification_status: "none" },
  // кандидаты в арендодатели (заявки на верификацию — pending)
  { key: "applicant1", phone: "+77000000021", role: "landlord", account_type: "self_employed", full_name: "Ерлан Токтаров", city: "taraz", verification_status: "pending" },
  { key: "applicant2", phone: "+77000000022", role: "landlord", account_type: "organization", org_name: 'ТОО "Жетысу Групп"', iin_bin: "555666777888", city: "taldykorgan", verification_status: "pending" },
  // админ
  { key: "admin", phone: "+77000000099", role: "admin", account_type: "individual", full_name: "Администратор платформы", city: "almaty", verification_status: "approved" },
];

await db.query("delete from users where phone = any($1)", [users.map((u) => u.phone)]);

const ids = {};
for (const u of users) {
  const { rows } = await db.query(
    `insert into users (phone, role, account_type, full_name, org_name, iin_bin, city, verification_status)
     values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
    [u.phone, u.role, u.account_type, u.full_name ?? null, u.org_name ?? null, u.iin_bin ?? null, u.city, u.verification_status],
  );
  ids[u.key] = rows[0].id;
}

// ---------- заявки на верификацию ----------
await db.query(
  `insert into verification_requests (user_id, type, data, status) values
   ($1,'self_employed',$2,'pending'),
   ($3,'organization',$4,'pending'),
   ($5,'self_employed',$6,'approved'),
   ($7,'organization',$8,'approved')`,
  [
    ids.applicant1, JSON.stringify({ iin: "880515300123", fullName: "Ерлан Токтаров", idNumber: "044556677", idExpiry: "2031-03-15", address: "г. Тараз, ул. Толе би 45, кв. 12" }),
    ids.applicant2, JSON.stringify({ iinBin: "555666777888", orgName: 'ТОО "Жетысу Групп"', legalAddress: "г. Талдыкорган, ул. Абая 15, офис 301" }),
    ids.landlord1, JSON.stringify({ iin: "850302300456", fullName: "Данияр Ахметов", idNumber: "033445566", idExpiry: "2030-06-01", address: "г. Алматы, мкр. Аксай-4, д. 12, кв. 45" }),
    ids.landlord2, JSON.stringify({ iinBin: "123456789012", orgName: 'ТОО "Астана Недвижимость"', legalAddress: "г. Астана, пр. Мангилик Ел 55, офис 210" }),
  ],
);

// ---------- квартиры ----------
const P = (owner, type, city, address, price, period, desc, seed, status = "free") => ({
  owner, type, city, address, price, rent_period: period, description: desc, seed, status,
});

const freeProps = [
  P("landlord1", "apartment", "almaty", "мкр. Коктем-2, д. 14, кв. 8", 280000, "month", "Светлая 2-комнатная квартира рядом с КазНУ. Свежий ремонт, вся техника, закрытый двор. Долгосрочная аренда для семьи или студентов.", "alm1"),
  P("landlord1", "apartment", "shymkent", "ул. Байтурсынова 18, кв. 22", 180000, "month", "Уютная 1-комнатная в центре Шымкента. Кондиционер, бойлер, мебель. Рядом рынок и остановки.", "shy1"),
  P("landlord2", "apartment", "astana", "пр. Туран 37, кв. 114", 350000, "month", "2-комнатная в ЖК бизнес-класса на Левом берегу. Панорамные окна, паркинг, охрана 24/7.", "ast1"),
  P("landlord2", "apartment", "aktobe", "пр. Абилкайыр-хана 85, кв. 3", 160000, "month", "1-комнатная после косметического ремонта. Тёплая, тихий двор, рядом школа и детсад.", "akt1"),
  P("landlord2", "apartment", "karaganda", "ул. Гоголя 51, кв. 17", 170000, "month", "2-комнатная возле центрального парка. Мебель частично, торг по цене при долгом сроке.", "kar1"),
];

const rentedProps = [
  { ...P("landlord1", "apartment", "almaty", "мкр. Самал-1, д. 9, кв. 31", 420000, "month", "3-комнатная с видом на горы, дизайнерский ремонт, два санузла.", "alm2", "rented"), tenant: "tenant1", startMonthsAgo: 3, units: 12, paid: 3 },
  { ...P("landlord1", "apartment", "taraz", "ул. Айтеке би 22, кв. 5", 150000, "month", "2-комнатная в спальном районе, всё необходимое для жизни.", "tar1", "rented"), tenant: "tenant4", startMonthsAgo: 2, units: 6, paid: 2 },
  { ...P("landlord2", "apartment", "astana", "ул. Сыганак 41, кв. 88", 380000, "month", "2-комнатная у Ботанического сада, тёплый паркинг в подарок.", "ast2", "rented"), tenant: "tenant2", startMonthsAgo: 1, units: 12, paid: 1 },
  { ...P("landlord2", "apartment", "pavlodar", "ул. Лермонтова 44, кв. 12", 140000, "month", "1-комнатная для командированных: заезжай и живи.", "pav1", "rented"), tenant: "tenant3", startMonthsAgo: 4, units: 12, paid: 3 },
];

const insertProperty = async (p) => {
  const owner = users.find((u) => u.key === p.owner);
  const { rows } = await db.query(
    `insert into properties (owner_id, type, address, city, gis_url, price, rent_period, description, photos, contact_phones, whatsapp_phones, status)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
    [
      ids[p.owner], p.type, p.address, p.city,
      `https://2gis.kz/search/${encodeURIComponent(p.address)}`,
      p.price, p.rent_period, p.description,
      photos(p.seed, 3), [owner.phone], [owner.phone], p.status,
    ],
  );
  return rows[0].id;
};

for (const p of freeProps) await insertProperty(p);

// занятые: договор active с подписями + график платежей
for (const p of rentedProps) {
  const propId = await insertProperty(p);
  const start = MONTH(-p.startMonthsAgo);
  const createdAt = MONTH(-p.startMonthsAgo, new Date(Date.now() - 3 * 86400000)); // привязали за ~3 дня до старта
  const { rows } = await db.query(
    `insert into rental_agreements (property_id, landlord_id, tenant_id, status, landlord_signed_at, tenant_signed_at, start_date, units_count, created_at)
     values ($1,$2,$3,'active',$4,$5,$6,$7,$8) returning id`,
    [propId, ids[p.owner], ids[p.tenant], createdAt, new Date(createdAt.getTime() + 3600e3), start, p.units, createdAt],
  );
  const agrId = rows[0].id;
  for (let i = 0; i < p.units; i++) {
    const ps = MONTH(i, start);
    const pe = MONTH(i + 1, start);
    const paidAt = i < p.paid ? new Date(ps.getTime() - 12 * 3600e3) : null; // платили за ~12ч до дедлайна
    await db.query(
      `insert into payment_installments (agreement_id, seq, period_start, period_end, due_at, amount, paid_at, created_at)
       values ($1,$2,$3,$4,$3,$5,$6,$7)`,
      [agrId, i + 1, ps, pe, p.price, paidAt, createdAt],
    );
  }
}

// пара лайков для живости
await db.query(
  `insert into favorites (user_id, property_id)
   select $1, id from properties where status='free' and city='almaty' limit 1`,
  [ids.tenant1],
);
await db.query(
  `insert into favorites (user_id, property_id)
   select $1, id from properties where status='free' and city='astana' limit 1`,
  [ids.tenant2],
);

const counts = await db.query(`
  select
    (select count(*) from users) users,
    (select count(*) from properties) props,
    (select count(*) from properties where status='rented') rented,
    (select count(*) from rental_agreements where status='active') agreements,
    (select count(*) from payment_installments) installments,
    (select count(*) from verification_requests where status='pending') pending_verifications
`);
console.log("seeded:", counts.rows[0]);
await db.end();
