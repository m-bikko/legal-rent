import { z } from "zod";

export const PropertyType = z.enum([
  "apartment",
  "house",
  "dacha",
  "office",
  "commercial",
  "building",
  "space",
]);
export type PropertyType = z.infer<typeof PropertyType>;

export const RentPeriod = z.enum(["hour", "day", "month"]);
export type RentPeriod = z.infer<typeof RentPeriod>;

export const PropertyStatus = z.enum(["free", "rented", "archived"]);
export type PropertyStatus = z.infer<typeof PropertyStatus>;

export const PropertySchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  type: PropertyType,
  address: z.string().min(1),
  city: z.string().min(1),
  gisUrl: z.string().url().nullable(),
  price: z.number().nonnegative(),
  rentPeriod: RentPeriod,
  description: z.string(),
  photos: z.array(z.string()),
  contactPhones: z.array(z.string()),
  whatsappPhones: z.array(z.string()),
  status: PropertyStatus,
  createdAt: z.string(),
});
export type Property = z.infer<typeof PropertySchema>;

/**
 * Ручные переходы статуса владельцем. Статус `rented` устанавливается
 * ТОЛЬКО через подписание договора обеими сторонами, снимается — завершением договора.
 */
export const canTransitionStatus = (
  from: PropertyStatus,
  to: PropertyStatus,
  ctx: { hasActiveAgreement: boolean },
): boolean => {
  if (to === "rented") return false;
  if (from === "rented" && ctx.hasActiveAgreement) return false;
  return from !== to;
};
