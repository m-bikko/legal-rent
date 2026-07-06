import { normalizeKzPhone, formatKzPhone } from "../src/phone";

describe("normalizeKzPhone", () => {
  it.each([
    ["87071234567", "+77071234567"],
    ["+7 707 123 45 67", "+77071234567"],
    ["7071234567", "+77071234567"],
    ["77071234567", "+77071234567"],
    ["+7 (747) 123-45-67", "+77471234567"],
  ])("normalizes %s -> %s", (input, expected) => {
    expect(normalizeKzPhone(input)).toBe(expected);
  });

  it.each([
    [""],
    ["12345"],
    ["+79991234567"], // российский мобильный — не КЗ (+7 9XX)
    ["87001"],
    ["abc"],
    ["8707123456789"],
  ])("rejects %s", (input) => {
    expect(normalizeKzPhone(input)).toBeNull();
  });
});

describe("formatKzPhone", () => {
  it("formats E.164 to display form", () => {
    expect(formatKzPhone("+77071234567")).toBe("+7 707 123 45 67");
  });

  it("returns input unchanged when it does not match", () => {
    expect(formatKzPhone("weird")).toBe("weird");
  });
});
