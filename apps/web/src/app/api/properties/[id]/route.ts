import {
  UpdatePropertyBody,
  allowedPropertyTypesFor,
  canTransitionStatus,
  normalizeKzPhone,
  type PropertyStatus,
} from "@rentlegal/core";
import { ApiError, handle, ok, parseBody, requireUser } from "@/server/api";
import { mapAgreement, mapProperty, mapUser, supabaseAdmin } from "@/server/db";

type Ctx = { params: Promise<{ id: string }> };

const loadOwned = async (id: string, userId: string) => {
  const { data: row } = await supabaseAdmin
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) throw new ApiError("not_found", 404);
  if (row.owner_id !== userId) throw new ApiError("forbidden", 403);
  return row;
};

const activeAgreementFor = async (propertyId: string) => {
  const { data } = await supabaseAdmin
    .from("rental_agreements")
    .select("*")
    .eq("property_id", propertyId)
    .in("status", ["draft", "active"])
    .maybeSingle();
  return data;
};

/** Объект владельца + текущий договор (draft/active) с данными арендатора. */
export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const row = await loadOwned(id, user.id);

  const agreementRow = await activeAgreementFor(id);
  let agreement = null;
  if (agreementRow) {
    const { data: tenant } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", agreementRow.tenant_id)
      .single();
    agreement = {
      ...mapAgreement(agreementRow),
      tenant: tenant ? mapUser(tenant) : null,
    };
  }

  return ok({ item: mapProperty(row), agreement });
});

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const row = await loadOwned(id, user.id);
  const body = await parseBody(UpdatePropertyBody, req);

  const patch: Record<string, unknown> = {};

  if (body.status && body.status !== row.status) {
    const agreement = await activeAgreementFor(id);
    const allowed = canTransitionStatus(row.status as PropertyStatus, body.status, {
      hasActiveAgreement: agreement?.status === "active",
    });
    if (!allowed) throw new ApiError("status_via_agreement_only", 409);
    patch.status = body.status;
  }

  if (body.type) {
    if (!allowedPropertyTypesFor(user.accountType).includes(body.type)) {
      throw new ApiError("self_employed_residential_only", 403);
    }
    patch.type = body.type;
  }
  if (body.address) patch.address = body.address;
  if (body.city) patch.city = body.city;
  if (body.gisUrl !== undefined) patch.gis_url = body.gisUrl || null;
  if (body.price !== undefined) patch.price = body.price;
  if (body.rentPeriod) patch.rent_period = body.rentPeriod;
  if (body.description !== undefined) patch.description = body.description;
  if (body.contactPhones) {
    const phones = body.contactPhones.map(normalizeKzPhone);
    if (phones.some((p) => !p)) throw new ApiError("invalid_phone");
    patch.contact_phones = phones;
  }
  if (body.whatsappPhones) {
    const phones = body.whatsappPhones.map(normalizeKzPhone);
    if (phones.some((p) => !p)) throw new ApiError("invalid_phone");
    patch.whatsapp_phones = phones;
  }

  const { data: updated, error } = await supabaseAdmin
    .from("properties")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !updated) throw new ApiError("unknown", 500);

  return ok({ item: mapProperty(updated) });
});
