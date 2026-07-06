import { z } from "zod";
import { handle, ok, parseBody, requireAdmin, ApiError } from "@/server/api";
import { supabaseAdmin } from "@/server/db";

const Body = z.object({ action: z.enum(["approve", "reject"]) });

type Ctx = { params: Promise<{ id: string }> };

/** Решение по заявке: обновляет и заявку, и статус пользователя. */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const { action } = await parseBody(Body, req);

  const { data: request } = await supabaseAdmin
    .from("verification_requests")
    .select("id, user_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!request) throw new ApiError("not_found", 404);
  if (request.status !== "pending") throw new ApiError("validation_error", 409);

  const status = action === "approve" ? "approved" : "rejected";
  await supabaseAdmin.from("verification_requests").update({ status }).eq("id", id);
  await supabaseAdmin
    .from("users")
    .update({ verification_status: status })
    .eq("id", request.user_id);

  return ok({ status });
});
