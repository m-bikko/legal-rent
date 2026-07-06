import type { RentPeriod } from "./property";

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** Максимум периодов аренды по единице времени. */
export const MAX_UNITS: Record<RentPeriod, number> = {
  hour: 720,
  day: 366,
  month: 60,
};

/**
 * Прибавляет n периодов к дате. Часы/дни — точные миллисекунды;
 * месяцы — календарно, день месяца клампится (31 янв + 1 мес = 28/29 фев).
 * Казахстан с 2024 живёт в одном фиксированном поясе (UTC+5, без DST),
 * поэтому UTC-арифметика не сдвигает локальное время.
 */
export const addPeriod = (date: Date, unit: RentPeriod, n: number): Date => {
  if (unit === "hour") return new Date(date.getTime() + n * HOUR_MS);
  if (unit === "day") return new Date(date.getTime() + n * DAY_MS);

  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + n);
  const daysInTarget = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, daysInTarget));
  return result;
};

export type InstallmentStatus =
  | "paid"
  | "upcoming"
  | "warning25"
  | "critical10"
  | "overdue";

/**
 * Статус платежа. Окно оплаты — один период до дедлайна (предоплата),
 * но не раньше момента создания графика (важно для первого платежа).
 * Пороги в долях окна автоматически масштабируются под единицу времени:
 * месяц → ~7.5 дн / 3 дн, день → 6 ч / 2.4 ч, час → 15 мин / 6 мин.
 */
export const installmentStatus = (
  inst: { dueAt: Date; paidAt: Date | null },
  unit: RentPeriod,
  scheduleCreatedAt: Date,
  now: Date,
): InstallmentStatus => {
  if (inst.paidAt) return "paid";
  if (now.getTime() >= inst.dueAt.getTime()) return "overdue";

  const naturalStart = addPeriod(inst.dueAt, unit, -1);
  const windowStart =
    naturalStart.getTime() > scheduleCreatedAt.getTime() ? naturalStart : scheduleCreatedAt;

  const total = inst.dueAt.getTime() - windowStart.getTime();
  if (total <= 0) return "critical10";

  const fractionLeft = (inst.dueAt.getTime() - now.getTime()) / total;
  if (fractionLeft < 0.1) return "critical10";
  if (fractionLeft < 0.25) return "warning25";
  return "upcoming";
};
