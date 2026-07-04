import {
  checkOtp,
  generateOtpCode,
  hashOtp,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
} from "@rentlegal/core";
import { supabaseAdmin } from "./db";
import { ApiError } from "./api";
import { otpSender } from "./otp-sender";

const otpSecret = () => process.env.SUPABASE_JWT_SECRET!;

/** Создаёт и «отправляет» код. Возвращает devCode, если сендер его раскрывает. */
export const issueOtp = async (phone: string): Promise<string | undefined> => {
  const { data: last } = await supabaseAdmin
    .from("otp_codes")
    .select("created_at")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last && Date.now() - new Date(last.created_at).getTime() < OTP_RESEND_COOLDOWN_MS) {
    throw new ApiError("otp_cooldown", 429);
  }

  const code = generateOtpCode();
  await supabaseAdmin.from("otp_codes").insert({
    phone,
    code_hash: hashOtp(code, phone, otpSecret()),
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });

  await otpSender.send(phone, code);
  return otpSender.exposesCode ? code : undefined;
};

/** Проверяет код по последней записи; неверный — +1 попытка, верный — consumed. */
export const verifyAndConsumeOtp = async (phone: string, code: string): Promise<void> => {
  const { data: row } = await supabaseAdmin
    .from("otp_codes")
    .select("*")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) throw new ApiError("otp_invalid");

  const result = checkOtp(
    {
      codeHash: row.code_hash,
      expiresAt: new Date(row.expires_at),
      attempts: row.attempts,
      consumed: row.consumed,
    },
    code,
    phone,
    otpSecret(),
    new Date(),
  );

  if (result === "invalid") {
    await supabaseAdmin
      .from("otp_codes")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id);
    throw new ApiError("otp_invalid");
  }
  if (result === "expired") throw new ApiError("otp_expired");
  if (result === "consumed") throw new ApiError("otp_consumed");
  if (result === "too_many_attempts") throw new ApiError("otp_too_many_attempts", 429);

  await supabaseAdmin.from("otp_codes").update({ consumed: true }).eq("id", row.id);
};
