import { ApiError, handle, ok, requireUser } from "@/server/api";
import { mapAgreement, supabaseAdmin } from "@/server/db";

type Ctx = { params: Promise<{ id: string }> };

/** Подпись своей стороны; обе подписи → договор active, объект rented. */
export const POST = handle(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;

  const { data: row } = await supabaseAdmin
    .from("rental_agreements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) throw new ApiError("not_found", 404);
  if (row.status !== "draft") throw new ApiError("agreement_exists", 409);

  const isLandlord = row.landlord_id === user.id;
  const isTenant = row.tenant_id === user.id;
  if (!isLandlord && !isTenant) throw new ApiError("forbidden", 403);

  const field = isLandlord ? "landlord_signed_at" : "tenant_signed_at";
  if (!row[field]) {
    row[field] = new Date().toISOString();
    await supabaseAdmin.from("rental_agreements").update({ [field]: row[field] }).eq("id", id);
  }

  if (row.landlord_signed_at && row.tenant_signed_at) {
    await supabaseAdmin.from("rental_agreements").update({ status: "active" }).eq("id", id);
    await supabaseAdmin
      .from("properties")
      .update({ status: "rented" })
      .eq("id", row.property_id);
    row.status = "active";
  }

  return ok({ item: mapAgreement(row) });
});
