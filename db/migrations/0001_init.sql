create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  role text not null check (role in ('tenant','landlord')),
  account_type text not null check (account_type in ('individual','self_employed','organization')),
  full_name text,
  org_name text,
  iin_bin text,
  city text not null,
  verification_status text not null default 'none'
    check (verification_status in ('none','pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  consumed boolean not null default false,
  created_at timestamptz not null default now()
);
create index otp_codes_phone_idx on otp_codes (phone, created_at desc);

create table verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('self_employed','organization')),
  data jsonb not null,
  doc_paths text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create index verification_requests_user_idx on verification_requests (user_id, created_at desc);

create table properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('apartment','house','dacha','office','commercial','building','space')),
  address text not null,
  city text not null,
  gis_url text,
  price numeric not null check (price >= 0),
  rent_period text not null check (rent_period in ('hour','day','month')),
  description text not null default '',
  photos text[] not null default '{}',
  contact_phones text[] not null default '{}',
  whatsapp_phones text[] not null default '{}',
  status text not null default 'free' check (status in ('free','rented','archived')),
  created_at timestamptz not null default now()
);
create index properties_feed_idx on properties (status, city, type, price);
create index properties_owner_idx on properties (owner_id, created_at desc);

create table favorites (
  user_id uuid not null references users(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

create table rental_agreements (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  landlord_id uuid not null references users(id),
  tenant_id uuid not null references users(id),
  status text not null default 'draft' check (status in ('draft','active','ended')),
  landlord_signed_at timestamptz,
  tenant_signed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index one_active_agreement_per_property
  on rental_agreements (property_id) where status in ('draft','active');
create index rental_agreements_tenant_idx on rental_agreements (tenant_id, created_at desc);

-- Контур безопасности MVP: RLS включён, политик нет — anon/authenticated не имеют
-- доступа ни к чему; сервер работает через service-role (bypass RLS).
alter table users enable row level security;
alter table otp_codes enable row level security;
alter table verification_requests enable row level security;
alter table properties enable row level security;
alter table favorites enable row level security;
alter table rental_agreements enable row level security;

insert into storage.buckets (id, name, public) values
  ('property-photos', 'property-photos', true),
  ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;
