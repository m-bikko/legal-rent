import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "lr_session";
const SESSION_TTL_SEC = 30 * 24 * 3600;

const secret = () => new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);

export const createSessionCookie = async (userId: string): Promise<void> => {
  const token = await new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SEC}s`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SEC,
    path: "/",
  });
};

export const readSession = async (): Promise<{ userId: string } | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ? { userId: payload.sub } : null;
  } catch {
    return null;
  }
};

export const clearSessionCookie = async (): Promise<void> => {
  const store = await cookies();
  store.delete(COOKIE_NAME);
};
