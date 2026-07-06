import { CreatePropertyBody, allowedPropertyTypesFor, normalizeKzPhone } from "@rentlegal/core";
import { ApiError, handle, ok, parseBody, requireUser } from "@/server/api";
import { mapProperty, supabaseAdmin } from "@/server/db";

export const GET = handle(async () => {
  const user = await requireUser();
  const { data: rows, error } = await supabaseAdmin
    .from("properties")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new ApiError("unknown", 500);
  return ok({ items: (rows ?? []).map(mapProperty) });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== "landlord") throw new ApiError("forbidden", 403);
  if (user.verificationStatus !== "approved") throw new ApiError("verification_required", 403);

  const body = await parseBody(CreatePropertyBody, req);
  if (!allowedPropertyTypesFor(user.accountType).includes(body.type)) {
    throw new ApiError("self_employed_residential_only", 403);
  }

  const contactPhones = body.contactPhones.map(normalizeKzPhone);
  const whatsappPhones = (body.whatsappPhones ?? []).map(normalizeKzPhone);
  if (contactPhones.some((p) => !p) || whatsappPhones.some((p) => !p)) {
    throw new ApiError("invalid_phone");
  }

  const { data: row, error } = await supabaseAdmin
    .from("properties")
    .insert({
      owner_id: user.id,
      type: body.type,
      address: body.address,
      city: body.city,
      gis_url: body.gisUrl || null,
      price: body.price,
      rent_period: body.rentPeriod,
      description: body.description,
      contact_phones: contactPhones,
      whatsapp_phones: whatsappPhones,
    })
    .select("*")
    .single();
  if (error || !row) throw new ApiError("unknown", 500);

  return ok({ item: mapProperty(row) });
});
