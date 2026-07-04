import {
  generateOtpCode,
  hashOtp,
  checkOtp,
  OTP_MAX_ATTEMPTS,
} from "../src/otp";

const SECRET = "test-secret";
const PHONE = "+77071234567";

const futureDate = () => new Date(Date.now() + 60_000);
const pastDate = () => new Date(Date.now() - 60_000);

const row = (code: string, overrides: Partial<Parameters<typeof checkOtp>[0]> = {}) => ({
  codeHash: hashOtp(code, PHONE, SECRET),
  expiresAt: futureDate(),
  attempts: 0,
  consumed: false,
  ...overrides,
});

describe("generateOtpCode", () => {
  it("produces 6-digit numeric codes", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });
});

describe("hashOtp", () => {
  it("is deterministic for same inputs", () => {
    expect(hashOtp("123456", PHONE, SECRET)).toBe(hashOtp("123456", PHONE, SECRET));
  });

  it("differs for different phones", () => {
    expect(hashOtp("123456", PHONE, SECRET)).not.toBe(
      hashOtp("123456", "+77081234567", SECRET),
    );
  });
});

describe("checkOtp", () => {
  it("returns valid for correct code", () => {
    expect(checkOtp(row("123456"), "123456", PHONE, SECRET, new Date())).toBe("valid");
  });

  it("returns invalid for wrong code", () => {
    expect(checkOtp(row("123456"), "654321", PHONE, SECRET, new Date())).toBe("invalid");
  });

  it("returns expired when past expiresAt", () => {
    expect(
      checkOtp(row("123456", { expiresAt: pastDate() }), "123456", PHONE, SECRET, new Date()),
    ).toBe("expired");
  });

  it("returns consumed for already used code", () => {
    expect(
      checkOtp(row("123456", { consumed: true }), "123456", PHONE, SECRET, new Date()),
    ).toBe("consumed");
  });

  it("returns too_many_attempts at the attempt limit", () => {
    expect(
      checkOtp(
        row("123456", { attempts: OTP_MAX_ATTEMPTS }),
        "123456",
        PHONE,
        SECRET,
        new Date(),
      ),
    ).toBe("too_many_attempts");
  });
});
