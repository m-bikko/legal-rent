// Типы данных API для клиента. Значения приходят из server/db-мапперов,
// импорт type-only — серверный код в клиентский бандл не попадает.
export type { AppUser, PropertyRow, AgreementRow, InstallmentRow } from "@/server/db";
