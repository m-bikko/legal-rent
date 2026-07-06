import { handle, ok, requireAdmin } from "@/server/api";
import { supabaseAdmin } from "@/server/db";

const tally = <T extends string>(rows: Record<string, unknown>[], key: string) => {
  const acc: Record<string, number> = {};
  for (const r of rows) {
    const v = String(r[key]);
    acc[v] = (acc[v] ?? 0) + 1;
  }
  return acc as Record<T, number>;
};

export const GET = handle(async () => {
  await requireAdmin();

  const [users, properties, agreements, installments, verifications] = await Promise.all([
    supabaseAdmin.from("users").select("role, account_type, verification_status"),
    supabaseAdmin.from("properties").select("status, city, type"),
    supabaseAdmin.from("rental_agreements").select("status"),
    supabaseAdmin.from("payment_installments").select("amount, paid_at, due_at"),
    supabaseAdmin.from("verification_requests").select("status"),
  ]);

  const u = users.data ?? [];
  const p = properties.data ?? [];
  const a = agreements.data ?? [];
  const inst = installments.data ?? [];
  const v = verifications.data ?? [];
  const now = Date.now();

  return ok({
    users: {
      total: u.length,
      byRole: tally(u, "role"),
      byAccountType: tally(u, "account_type"),
      verified: u.filter((x) => x.verification_status === "approved").length,
      pendingVerification: u.filter((x) => x.verification_status === "pending").length,
    },
    properties: {
      total: p.length,
      byStatus: tally(p, "status"),
      byCity: tally(p, "city"),
      byType: tally(p, "type"),
    },
    agreements: { byStatus: tally(a, "status") },
    payments: {
      installments: inst.length,
      paid: inst.filter((x) => x.paid_at).length,
      overdue: inst.filter((x) => !x.paid_at && new Date(x.due_at).getTime() < now).length,
      paidSum: inst.filter((x) => x.paid_at).reduce((s, x) => s + Number(x.amount), 0),
      expectedSum: inst.reduce((s, x) => s + Number(x.amount), 0),
    },
    verifications: { byStatus: tally(v, "status") },
  });
});
