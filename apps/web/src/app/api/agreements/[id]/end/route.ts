import { ApiError, handle, ok, requireUser } from "@/server/api";
import { mapAgreement, supabaseAdmin } from "@/server/db";

type Ctx = { params: Promise<{ id: string }> };

/** Завершение аренды (или отмена draft) арендодателем: объект снова free. */
export const POST = handle(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;

  const { data: row } = await supabaseAdmin
    .from("rental_agreements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) throw new ApiError("not_found", 404);
  if (row.landlord_id !== user.id) throw new ApiError("forbidden", 403);
  if (row.status === "ended") throw new ApiError("not_found", 409);

  const { data: updated } = await supabaseAdmin
    .from("rental_agreements")
    .update({ status: "ended" })
    .eq("id", id)
    .select("*")
    .single();

  await supabaseAdmin
    .from("properties")
    .update({ status: "free" })
    .eq("id", row.property_id);

  return ok({ item: mapAgreement(updated ?? { ...row, status: "ended" }) });
});
