import { VerifyOtpBody, normalizeKzPhone } from "@rentlegal/core";
import { ApiError, handle, ok, parseBody } from "@/server/api";
import { mapUser, supabaseAdmin } from "@/server/db";
import { verifyAndConsumeOtp } from "@/server/otp-service";
import { createSessionCookie } from "@/server/session";

export const POST = handle(async (req: Request) => {
  const body = await parseBody(VerifyOtpBody, req);
  const phone = normalizeKzPhone(body.phone);
  if (!phone) throw new ApiError("invalid_phone");

  const { data: row } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();
  if (!row) throw new ApiError("user_not_found", 404);

  await verifyAndConsumeOtp(phone, body.code);
  await createSessionCookie(row.id);
  return ok({ user: mapUser(row) });
});
