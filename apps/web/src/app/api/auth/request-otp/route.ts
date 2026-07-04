import { RequestOtpBody, normalizeKzPhone } from "@rentlegal/core";
import { ApiError, handle, ok, parseBody } from "@/server/api";
import { supabaseAdmin } from "@/server/db";
import { issueOtp } from "@/server/otp-service";

export const POST = handle(async (req: Request) => {
  const body = await parseBody(RequestOtpBody, req);
  const phone = normalizeKzPhone(body.phone);
  if (!phone) throw new ApiError("invalid_phone");

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (body.flow === "login" && !existing) throw new ApiError("user_not_found", 404);
  if (body.flow === "register" && existing) throw new ApiError("user_exists", 409);

  const devCode = await issueOtp(phone);
  return ok({ phone, devCode });
});
