import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { supabaseAdmin, mapUser, type AppUser } from "./db";
import { readSession } from "./session";

export type ErrorCode =
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "invalid_phone"
  | "user_not_found"
  | "user_exists"
  | "otp_cooldown"
  | "otp_invalid"
  | "otp_expired"
  | "otp_too_many_attempts"
  | "otp_consumed"
  | "not_found"
  | "verification_required"
  | "verification_pending"
  | "tenant_not_found"
  | "cannot_rent_own"
  | "agreement_exists"
  | "status_via_agreement_only"
  | "upload_failed"
  | "unknown";

export const ok = <T>(data: T, init?: ResponseInit) =>
  NextResponse.json({ ok: true as const, data }, init);

export const fail = (code: ErrorCode, status = 400) =>
  NextResponse.json(
    { ok: false as const, error: { code, message: code } },
    { status },
  );

/** Ошибка-исключение для короткого выхода из хендлера. */
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public status = 400,
  ) {
    super(code);
  }
}

export const parseBody = async <T>(schema: ZodSchema<T>, req: Request): Promise<T> => {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new ApiError("validation_error", 400);
  return parsed.data;
};

export const requireUser = async (): Promise<AppUser> => {
  const session = await readSession();
  if (!session) throw new ApiError("unauthorized", 401);
  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", session.userId)
    .maybeSingle();
  if (!data) throw new ApiError("unauthorized", 401);
  return mapUser(data);
};

/** Оборачивает хендлер: ApiError → типовой ответ, прочее → 500 unknown. */
export const handle =
  <Args extends unknown[]>(
    fn: (...args: Args) => Promise<NextResponse>,
  ): ((...args: Args) => Promise<NextResponse>) =>
  async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return fail(err.code, err.status);
      console.error("[api] unhandled error:", err);
      return fail("unknown", 500);
    }
  };
