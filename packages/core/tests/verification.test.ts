import { requiredVerificationType, verificationFields } from "../src/verification";

describe("requiredVerificationType", () => {
  it("individual account goes to self_employed verification", () => {
    expect(requiredVerificationType("individual")).toBe("self_employed");
  });

  it("self_employed account stays self_employed", () => {
    expect(requiredVerificationType("self_employed")).toBe("self_employed");
  });

  it("organization account goes to organization verification", () => {
    expect(requiredVerificationType("organization")).toBe("organization");
  });
});

describe("verificationFields", () => {
  it("self_employed requires personal id data", () => {
    expect(verificationFields("self_employed")).toEqual([
      "iin", "fullName", "idNumber", "idExpiry", "address",
    ]);
  });

  it("organization requires business notice and registration data", () => {
    expect(verificationFields("organization")).toEqual([
      "noticeFile", "iinBin", "orgName", "legalAddress",
    ]);
  });
});
