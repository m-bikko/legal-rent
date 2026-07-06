import { z } from "zod";
import { PropertyType, RentPeriod } from "./property";
import { AccountType } from "./verification";
import { CITY_IDS } from "./cities";

export const UserRole = z.enum(["tenant", "landlord"]);
export type UserRole = z.infer<typeof UserRole>;

const CityIdSchema = z.enum(CITY_IDS);

const phone = z.string().min(10).max(20);
const otpCode = z.string().regex(/^\d{6}$/);

export const RequestOtpBody = z.object({
  phone,
  flow: z.enum(["login", "register"]),
});
export type RequestOtpBody = z.infer<typeof RequestOtpBody>;

export const RegisterBody = z
  .object({
    phone,
    code: otpCode,
    role: UserRole,
    accountType: AccountType,
    fullName: z.string().trim().min(2).max(200).optional(),
    orgName: z.string().trim().min(2).max(200).optional(),
    iinBin: z.string().regex(/^\d{12}$/).optional(),
    city: CityIdSchema,
  })
  .superRefine((val, ctx) => {
    if (val.accountType === "organization") {
      if (!val.orgName) ctx.addIssue({ code: "custom", path: ["orgName"], message: "required" });
      if (!val.iinBin) ctx.addIssue({ code: "custom", path: ["iinBin"], message: "required" });
    } else if (!val.fullName) {
      ctx.addIssue({ code: "custom", path: ["fullName"], message: "required" });
    }
    if (val.role === "landlord" && val.accountType === "individual") {
      ctx.addIssue({ code: "custom", path: ["accountType"], message: "landlord_individual_forbidden" });
    }
  });
export type RegisterBody = z.infer<typeof RegisterBody>;

export const VerifyOtpBody = z.object({ phone, code: otpCode });
export type VerifyOtpBody = z.infer<typeof VerifyOtpBody>;

export const ListingsQuery = z.object({
  city: CityIdSchema.optional(),
  type: PropertyType.optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  rentPeriod: RentPeriod.optional(),
});
export type ListingsQuery = z.infer<typeof ListingsQuery>;

export const CreatePropertyBody = z.object({
  type: PropertyType,
  address: z.string().trim().min(3).max(300),
  city: CityIdSchema,
  gisUrl: z.string().url().max(500).optional().or(z.literal("")),
  price: z.number().positive(),
  rentPeriod: RentPeriod,
  description: z.string().trim().max(5000).default(""),
  contactPhones: z.array(phone).min(1).max(3),
  whatsappPhones: z.array(phone).max(3).default([]),
});
export type CreatePropertyBody = z.infer<typeof CreatePropertyBody>;

export const UpdatePropertyBody = CreatePropertyBody.partial().extend({
  status: z.enum(["free", "archived"]).optional(),
});
export type UpdatePropertyBody = z.infer<typeof UpdatePropertyBody>;

export const ToggleFavoriteBody = z.object({ propertyId: z.string().uuid() });
export type ToggleFavoriteBody = z.infer<typeof ToggleFavoriteBody>;

export const SelfEmployedVerificationData = z.object({
  iin: z.string().regex(/^\d{12}$/),
  fullName: z.string().trim().min(2).max(200),
  idNumber: z.string().trim().min(5).max(20),
  idExpiry: z.string().min(4),
  address: z.string().trim().min(3).max(300),
});

export const OrganizationVerificationData = z.object({
  iinBin: z.string().regex(/^\d{12}$/),
  orgName: z.string().trim().min(2).max(200),
  legalAddress: z.string().trim().min(3).max(300),
});

export const CreateAgreementBody = z.object({
  propertyId: z.string().uuid(),
  tenantPhone: phone,
  /** Дата начала оплаты — первый дедлайн графика (ISO). */
  startDate: z.string().datetime(),
  /** Сколько периодов аренды берёт арендатор (лимит по единице — MAX_UNITS). */
  unitsCount: z.number().int().min(1).max(720),
});
export type CreateAgreementBody = z.infer<typeof CreateAgreementBody>;

export const SetInstallmentPaidBody = z.object({ paid: z.boolean() });
export type SetInstallmentPaidBody = z.infer<typeof SetInstallmentPaidBody>;

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: { code: string; message: string } };
export type ApiResponse<T> = ApiOk<T> | ApiErr;
