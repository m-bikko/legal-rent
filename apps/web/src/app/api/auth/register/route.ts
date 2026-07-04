import { RegisterBody, normalizeKzPhone } from "@rentlegal/core";
import { ApiError, handle, ok, parseBody } from "@/server/api";
import { mapUser, supabaseAdmin } from "@/server/db";
import { verifyAndConsumeOtp } from "@/server/otp-service";
import { createSessionCookie } from "@/server/session";

export const POST = handle(async (req: Request) => {
  const body = await parseBody(RegisterBody, req);
  const phone = normalizeKzPhone(body.phone);
  if (!phone) throw new ApiError("invalid_phone");

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();
  if (existing) throw new ApiError("user_exists", 409);

  await verifyAndConsumeOtp(phone, body.code);

  const { data: row, error } = await supabaseAdmin
    .from("users")
    .insert({
      phone,
      role: body.role,
      account_type: body.accountType,
      full_name: body.fullName ?? null,
      org_name: body.orgName ?? null,
      iin_bin: body.iinBin ?? null,
      city: body.city,
    })
    .select("*")
    .single();
  if (error || !row) throw new ApiError("unknown", 500);

  await createSessionCookie(row.id);
  return ok({ user: mapUser(row) });
});
