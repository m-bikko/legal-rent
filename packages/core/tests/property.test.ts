import { canTransitionStatus, PropertyType, RentPeriod, PropertyStatus } from "../src/property";

describe("canTransitionStatus (manual transitions by owner)", () => {
  it("allows free -> archived", () => {
    expect(canTransitionStatus("free", "archived", { hasActiveAgreement: false })).toBe(true);
  });

  it("allows archived -> free", () => {
    expect(canTransitionStatus("archived", "free", { hasActiveAgreement: false })).toBe(true);
  });

  it("forbids manual transition to rented (only via agreement)", () => {
    expect(canTransitionStatus("free", "rented", { hasActiveAgreement: false })).toBe(false);
    expect(canTransitionStatus("free", "rented", { hasActiveAgreement: true })).toBe(false);
  });

  it("forbids archiving a rented property while agreement is active", () => {
    expect(canTransitionStatus("rented", "archived", { hasActiveAgreement: true })).toBe(false);
  });

  it("forbids rented -> free while agreement is active (must end agreement)", () => {
    expect(canTransitionStatus("rented", "free", { hasActiveAgreement: true })).toBe(false);
  });
});

describe("domain enums", () => {
  it("property types match spec", () => {
    expect(PropertyType.options).toEqual([
      "apartment", "house", "dacha", "office", "commercial", "building", "space",
    ]);
  });

  it("rent periods match spec", () => {
    expect(RentPeriod.options).toEqual(["hour", "day", "month"]);
  });

  it("statuses match spec", () => {
    expect(PropertyStatus.options).toEqual(["free", "rented", "archived"]);
  });
});
