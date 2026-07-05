import { SetInstallmentPaidBody } from "@rentlegal/core";
import { ApiError, handle, ok, parseBody, requireUser } from "@/server/api";
import { mapInstallment, supabaseAdmin } from "@/server/db";

type Ctx = { params: Promise<{ id: string; seq: string }> };

/** Отметка «оплачено» — только арендодатель (получатель платежа). Снимаемая. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id, seq } = await params;
  const seqNum = Number(seq);
  if (!Number.isInteger(seqNum) || seqNum < 1) throw new ApiError("validation_error");

  const body = await parseBody(SetInstallmentPaidBody, req);

  const { data: agreement } = await supabaseAdmin
    .from("rental_agreements")
    .select("id, landlord_id")
    .eq("id", id)
    .maybeSingle();
  if (!agreement) throw new ApiError("not_found", 404);
  if (agreement.landlord_id !== user.id) throw new ApiError("forbidden", 403);

  const { data: updated, error } = await supabaseAdmin
    .from("payment_installments")
    .update({ paid_at: body.paid ? new Date().toISOString() : null })
    .eq("agreement_id", id)
    .eq("seq", seqNum)
    .select("*")
    .single();
  if (error || !updated) throw new ApiError("not_found", 404);

  return ok({ item: mapInstallment(updated) });
});
