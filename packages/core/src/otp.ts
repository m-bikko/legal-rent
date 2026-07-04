import { createHash, randomInt } from "node:crypto";

export const OTP_TTL_MS = 5 * 60_000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60_000;

export const generateOtpCode = (): string =>
  randomInt(0, 1_000_000).toString().padStart(6, "0");

/** Хеш кода привязан к номеру: код одного номера нельзя использовать для другого. */
export const hashOtp = (code: string, phone: string, secret: string): string =>
  createHash("sha256").update(`${code}:${phone}:${secret}`).digest("hex");

export type OtpCheckResult =
  | "valid"
  | "invalid"
  | "expired"
  | "consumed"
  | "too_many_attempts";

export interface OtpRow {
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumed: boolean;
}

export const checkOtp = (
  row: OtpRow,
  code: string,
  phone: string,
  secret: string,
  now: Date,
): OtpCheckResult => {
  if (row.consumed) return "consumed";
  if (row.attempts >= OTP_MAX_ATTEMPTS) return "too_many_attempts";
  if (now > row.expiresAt) return "expired";
  return hashOtp(code, phone, secret) === row.codeHash ? "valid" : "invalid";
};
