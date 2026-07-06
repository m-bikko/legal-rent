import { z } from "zod";

export const AccountType = z.enum(["individual", "self_employed", "organization"]);
export type AccountType = z.infer<typeof AccountType>;

export const VerificationType = z.enum(["self_employed", "organization"]);
export type VerificationType = z.infer<typeof VerificationType>;

export const VerificationStatus = z.enum(["none", "pending", "approved", "rejected"]);
export type VerificationStatus = z.infer<typeof VerificationStatus>;

/** Физлицо верифицируется как самозанятый, организация — как ИП/ТОО. */
export const requiredVerificationType = (accountType: AccountType): VerificationType =>
  accountType === "organization" ? "organization" : "self_employed";

export const SELF_EMPLOYED_FIELDS = [
  "iin",
  "fullName",
  "idNumber",
  "idExpiry",
  "address",
] as const;

export const ORGANIZATION_FIELDS = [
  "noticeFile",
  "iinBin",
  "orgName",
  "legalAddress",
] as const;

export const verificationFields = (
  type: VerificationType,
): readonly string[] =>
  type === "self_employed" ? SELF_EMPLOYED_FIELDS : ORGANIZATION_FIELDS;
