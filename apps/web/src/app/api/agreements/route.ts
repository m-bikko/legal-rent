import {
  CreateAgreementBody,
  MAX_UNITS,
  addPeriod,
  normalizeKzPhone,
  type RentPeriod,
} from "@rentlegal/core";
import { ApiError, handle, ok, parseBody, requireUser } from "@/server/api";
import { mapAgreement, mapInstallment, mapProperty, supabaseAdmin } from "@/server/db";

/** Мои договоры (draft/active) с графиком платежей — как арендатора и как арендодателя. */
export const GET = handle(async () => {
  const user = await requireUser();
  const { data: rows, error } = await supabaseAdmin
    .from("rental_agreements")
    .select("*, properties(*)")
    .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`)
    .in("status", ["draft", "active"])
    .order("created_at", { ascending: false });
  if (error) throw new ApiError("unknown", 500);

  const ids = (rows ?? []).map((r) => r.id);
  const bySchedule = new Map<string, ReturnType<typeof mapInstallment>[]>();
  if (ids.length > 0) {
    const { data: insts } = await supabaseAdmin
      .from("payment_installments")
      .select("*")
      .in("agreement_id", ids)
      .order("seq", { ascending: true });
    for (const inst of insts ?? []) {
      const mapped = mapInstallment(inst);
      const list = bySchedule.get(mapped.agreementId) ?? [];
      list.push(mapped);
      bySchedule.set(mapped.agreementId, list);
    }
  }

  const items = (rows ?? []).map((r) => ({
    ...mapAgreement(r),
    property: mapProperty(r.properties as unknown as Record<string, unknown>),
    installments: bySchedule.get(r.id) ?? [],
  }));
  return ok({ items });
});

/** Привязка арендатора по номеру: создаёт draft-договор. */
export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = await parseBody(CreateAgreementBody, req);

  const { data: property } = await supabaseAdmin
    .from("properties")
    .select("*")
    .eq("id", body.propertyId)
    .maybeSingle();
  if (!property) throw new ApiError("not_found", 404);
  if (property.owner_id !== user.id) throw new ApiError("forbidden", 403);
  if (property.status !== "free") throw new ApiError("agreement_exists", 409);

  const phone = normalizeKzPhone(body.tenantPhone);
  if (!phone) throw new ApiError("invalid_phone");

  const { data: tenant } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  if (!tenant) throw new ApiError("tenant_not_found", 404);
  if (tenant.id === user.id) throw new ApiError("cannot_rent_own", 409);

  const unit = property.rent_period as RentPeriod;
  if (body.unitsCount > MAX_UNITS[unit]) throw new ApiError("validation_error");
  const startDate = new Date(body.startDate);
  if (Number.isNaN(startDate.getTime())) throw new ApiError("validation_error");

  const { data: row, error } = await supabaseAdmin
    .from("rental_agreements")
    .insert({
      property_id: property.id,
      landlord_id: user.id,
      tenant_id: tenant.id,
      start_date: startDate.toISOString(),
      units_count: body.unitsCount,
    })
    .select("*")
    .single();
  // unique-индекс one_active_agreement_per_property защищает от гонки
  if (error) throw new ApiError("agreement_exists", 409);

  // График: платёж i покрывает [start+i, start+i+1), дедлайн — начало периода (предоплата)
  const installments = Array.from({ length: body.unitsCount }, (_, i) => {
    const periodStart = addPeriod(startDate, unit, i);
    return {
      agreement_id: row.id,
      seq: i + 1,
      period_start: periodStart.toISOString(),
      period_end: addPeriod(startDate, unit, i + 1).toISOString(),
      due_at: periodStart.toISOString(),
      amount: property.price,
    };
  });
  const { error: instError } = await supabaseAdmin
    .from("payment_installments")
    .insert(installments);
  if (instError) {
    // не оставляем договор без графика
    await supabaseAdmin.from("rental_agreements").delete().eq("id", row.id);
    throw new ApiError("unknown", 500);
  }

  return ok({ item: mapAgreement(row) });
});
