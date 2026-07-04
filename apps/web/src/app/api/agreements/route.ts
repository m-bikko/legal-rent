import { CreateAgreementBody, normalizeKzPhone } from "@rentlegal/core";
import { ApiError, handle, ok, parseBody, requireUser } from "@/server/api";
import { mapAgreement, mapProperty, supabaseAdmin } from "@/server/db";

/** Мои договоры (draft/active) — и как арендатора, и как арендодателя. */
export const GET = handle(async () => {
  const user = await requireUser();
  const { data: rows, error } = await supabaseAdmin
    .from("rental_agreements")
    .select("*, properties(*)")
    .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`)
    .in("status", ["draft", "active"])
    .order("created_at", { ascending: false });
  if (error) throw new ApiError("unknown", 500);

  const items = (rows ?? []).map((r) => ({
    ...mapAgreement(r),
    property: mapProperty(r.properties as unknown as Record<string, unknown>),
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

  const { data: row, error } = await supabaseAdmin
    .from("rental_agreements")
    .insert({
      property_id: property.id,
      landlord_id: user.id,
      tenant_id: tenant.id,
    })
    .select("*")
    .single();
  // unique-индекс one_active_agreement_per_property защищает от гонки
  if (error) throw new ApiError("agreement_exists", 409);

  return ok({ item: mapAgreement(row) });
});
