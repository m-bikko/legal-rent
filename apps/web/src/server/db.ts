import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { UserRole, AccountType, VerificationStatus } from "@rentlegal/core";

/**
 * Server-only клиент с service-role: обходит RLS, никогда не попадает в браузер.
 * Инициализация ленивая: при `next build` роуты импортируются на этапе
 * «Collecting page data», когда env может отсутствовать — клиент создаётся
 * только при первом реальном обращении.
 */
let adminClient: SupabaseClient | null = null;

const getAdmin = (): SupabaseClient => {
  adminClient ??= createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return adminClient;
};

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const value = Reflect.get(getAdmin(), prop, getAdmin());
    return typeof value === "function" ? value.bind(getAdmin()) : value;
  },
});

export interface AppUser {
  id: string;
  phone: string;
  role: UserRole;
  accountType: AccountType;
  fullName: string | null;
  orgName: string | null;
  iinBin: string | null;
  city: string;
  verificationStatus: VerificationStatus;
}

// snake_case строки БД → camelCase доменного слоя
export const mapUser = (row: Record<string, unknown>): AppUser => ({
  id: row.id as string,
  phone: row.phone as string,
  role: row.role as UserRole,
  accountType: row.account_type as AccountType,
  fullName: (row.full_name as string | null) ?? null,
  orgName: (row.org_name as string | null) ?? null,
  iinBin: (row.iin_bin as string | null) ?? null,
  city: row.city as string,
  verificationStatus: row.verification_status as VerificationStatus,
});

export interface PropertyRow {
  id: string;
  ownerId: string;
  type: string;
  address: string;
  city: string;
  gisUrl: string | null;
  price: number;
  rentPeriod: string;
  description: string;
  photos: string[];
  contactPhones: string[];
  whatsappPhones: string[];
  status: string;
  createdAt: string;
  isLiked?: boolean;
}

export const mapProperty = (row: Record<string, unknown>): PropertyRow => ({
  id: row.id as string,
  ownerId: row.owner_id as string,
  type: row.type as string,
  address: row.address as string,
  city: row.city as string,
  gisUrl: (row.gis_url as string | null) ?? null,
  price: Number(row.price),
  rentPeriod: row.rent_period as string,
  description: row.description as string,
  photos: (row.photos as string[]) ?? [],
  contactPhones: (row.contact_phones as string[]) ?? [],
  whatsappPhones: (row.whatsapp_phones as string[]) ?? [],
  status: row.status as string,
  createdAt: row.created_at as string,
});

export interface AgreementRow {
  id: string;
  propertyId: string;
  landlordId: string;
  tenantId: string;
  status: string;
  landlordSignedAt: string | null;
  tenantSignedAt: string | null;
  startDate: string | null;
  unitsCount: number | null;
  createdAt: string;
}

export const mapAgreement = (row: Record<string, unknown>): AgreementRow => ({
  id: row.id as string,
  propertyId: row.property_id as string,
  landlordId: row.landlord_id as string,
  tenantId: row.tenant_id as string,
  status: row.status as string,
  landlordSignedAt: (row.landlord_signed_at as string | null) ?? null,
  tenantSignedAt: (row.tenant_signed_at as string | null) ?? null,
  startDate: (row.start_date as string | null) ?? null,
  unitsCount: (row.units_count as number | null) ?? null,
  createdAt: row.created_at as string,
});

export interface InstallmentRow {
  id: string;
  agreementId: string;
  seq: number;
  periodStart: string;
  periodEnd: string;
  dueAt: string;
  amount: number;
  paidAt: string | null;
  createdAt: string;
}

export const mapInstallment = (row: Record<string, unknown>): InstallmentRow => ({
  id: row.id as string,
  agreementId: row.agreement_id as string,
  seq: row.seq as number,
  periodStart: row.period_start as string,
  periodEnd: row.period_end as string,
  dueAt: row.due_at as string,
  amount: Number(row.amount),
  paidAt: (row.paid_at as string | null) ?? null,
  createdAt: row.created_at as string,
});
