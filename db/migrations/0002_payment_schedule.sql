alter table rental_agreements
  add column start_date timestamptz,
  add column units_count int check (units_count is null or units_count between 1 and 720);

create table payment_installments (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references rental_agreements(id) on delete cascade,
  seq int not null check (seq >= 1),
  period_start timestamptz not null,
  period_end timestamptz not null,
  due_at timestamptz not null,
  amount numeric not null check (amount >= 0),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (agreement_id, seq)
);
create index payment_installments_agreement_idx on payment_installments (agreement_id, seq);

alter table payment_installments enable row level security;
