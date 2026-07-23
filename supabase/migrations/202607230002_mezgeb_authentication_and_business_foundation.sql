-- Conflict-safe Mezgeb authentication and business foundation.
-- This migration intentionally uses mezgeb_* table names so it can coexist with
-- other schemas in the same Supabase project without overwriting them.

create extension if not exists pgcrypto;

create table if not exists public.mezgeb_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  preferred_language text not null default 'en' check (preferred_language in ('en','am')),
  last_business_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mezgeb_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  business_type text,
  tin text,
  phone text,
  city text,
  vat_registered boolean not null default false,
  currency text not null default 'ETB' check (currency = 'ETB'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mezgeb_profiles
  drop constraint if exists mezgeb_profiles_last_business_id_fkey;

alter table public.mezgeb_profiles
  add constraint mezgeb_profiles_last_business_id_fkey
  foreign key (last_business_id)
  references public.mezgeb_businesses(id)
  on delete set null;

create table if not exists public.mezgeb_customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.mezgeb_businesses(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  phone text,
  notes text,
  credit_limit numeric(14,2) not null default 0 check (credit_limit >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mezgeb_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.mezgeb_businesses(id) on delete cascade,
  customer_id uuid references public.mezgeb_customers(id) on delete set null,
  type text not null check (
    type in ('sale','expense','credit_sale','credit_payment','supplier_purchase','adjustment')
  ),
  description text not null check (char_length(btrim(description)) between 1 and 500),
  amount numeric(14,2) not null check (amount > 0),
  vat_amount numeric(14,2) not null default 0 check (vat_amount >= 0),
  payment_method text not null default 'cash' check (
    payment_method in ('cash','telebirr','mpesa','cbe_birr','bank','dube','other')
  ),
  occurred_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mezgeb_receipts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.mezgeb_businesses(id) on delete cascade,
  customer_id uuid references public.mezgeb_customers(id) on delete set null,
  transaction_id uuid references public.mezgeb_transactions(id) on delete set null,
  receipt_number text not null,
  subtotal numeric(14,2) not null check (subtotal >= 0),
  vat_amount numeric(14,2) not null default 0 check (vat_amount >= 0),
  total numeric(14,2) not null check (total >= 0),
  status text not null default 'issued' check (status in ('draft','issued','void')),
  issued_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (business_id, receipt_number)
);

create table if not exists public.mezgeb_audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  business_id uuid references public.mezgeb_businesses(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.mezgeb_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'requested' check (
    status in ('requested','processing','completed','cancelled')
  ),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists mezgeb_businesses_owner_idx
  on public.mezgeb_businesses(owner_id);
create index if not exists mezgeb_customers_business_idx
  on public.mezgeb_customers(business_id);
create index if not exists mezgeb_transactions_business_date_idx
  on public.mezgeb_transactions(business_id, occurred_at desc);
create index if not exists mezgeb_transactions_customer_idx
  on public.mezgeb_transactions(customer_id)
  where customer_id is not null;
create index if not exists mezgeb_receipts_business_date_idx
  on public.mezgeb_receipts(business_id, issued_at desc);
create index if not exists mezgeb_audit_logs_business_date_idx
  on public.mezgeb_audit_logs(business_id, created_at desc);

create or replace function public.mezgeb_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_mezgeb_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.mezgeb_profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do update
    set full_name = case
      when public.mezgeb_profiles.full_name = '' then excluded.full_name
      else public.mezgeb_profiles.full_name
    end,
    updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_mezgeb_user() from public, anon, authenticated, service_role;
grant execute on function public.handle_new_mezgeb_user() to postgres;

drop trigger if exists on_auth_user_created_mezgeb on auth.users;
create trigger on_auth_user_created_mezgeb
  after insert on auth.users
  for each row execute procedure public.handle_new_mezgeb_user();

drop trigger if exists mezgeb_profiles_updated_at on public.mezgeb_profiles;
create trigger mezgeb_profiles_updated_at
  before update on public.mezgeb_profiles
  for each row execute procedure public.mezgeb_set_updated_at();

drop trigger if exists mezgeb_businesses_updated_at on public.mezgeb_businesses;
create trigger mezgeb_businesses_updated_at
  before update on public.mezgeb_businesses
  for each row execute procedure public.mezgeb_set_updated_at();

drop trigger if exists mezgeb_customers_updated_at on public.mezgeb_customers;
create trigger mezgeb_customers_updated_at
  before update on public.mezgeb_customers
  for each row execute procedure public.mezgeb_set_updated_at();

drop trigger if exists mezgeb_transactions_updated_at on public.mezgeb_transactions;
create trigger mezgeb_transactions_updated_at
  before update on public.mezgeb_transactions
  for each row execute procedure public.mezgeb_set_updated_at();

alter table public.mezgeb_profiles enable row level security;
alter table public.mezgeb_businesses enable row level security;
alter table public.mezgeb_customers enable row level security;
alter table public.mezgeb_transactions enable row level security;
alter table public.mezgeb_receipts enable row level security;
alter table public.mezgeb_audit_logs enable row level security;
alter table public.mezgeb_deletion_requests enable row level security;

drop policy if exists mezgeb_profiles_select_own on public.mezgeb_profiles;
create policy mezgeb_profiles_select_own
  on public.mezgeb_profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists mezgeb_profiles_update_own on public.mezgeb_profiles;
create policy mezgeb_profiles_update_own
  on public.mezgeb_profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists mezgeb_businesses_owner_all on public.mezgeb_businesses;
create policy mezgeb_businesses_owner_all
  on public.mezgeb_businesses for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists mezgeb_customers_owner_all on public.mezgeb_customers;
create policy mezgeb_customers_owner_all
  on public.mezgeb_customers for all to authenticated
  using (
    exists (
      select 1 from public.mezgeb_businesses b
      where b.id = mezgeb_customers.business_id
        and b.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.mezgeb_businesses b
      where b.id = mezgeb_customers.business_id
        and b.owner_id = (select auth.uid())
    )
  );

drop policy if exists mezgeb_transactions_owner_all on public.mezgeb_transactions;
create policy mezgeb_transactions_owner_all
  on public.mezgeb_transactions for all to authenticated
  using (
    exists (
      select 1 from public.mezgeb_businesses b
      where b.id = mezgeb_transactions.business_id
        and b.owner_id = (select auth.uid())
    )
  )
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.mezgeb_businesses b
      where b.id = mezgeb_transactions.business_id
        and b.owner_id = (select auth.uid())
    )
  );

drop policy if exists mezgeb_receipts_owner_all on public.mezgeb_receipts;
create policy mezgeb_receipts_owner_all
  on public.mezgeb_receipts for all to authenticated
  using (
    exists (
      select 1 from public.mezgeb_businesses b
      where b.id = mezgeb_receipts.business_id
        and b.owner_id = (select auth.uid())
    )
  )
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.mezgeb_businesses b
      where b.id = mezgeb_receipts.business_id
        and b.owner_id = (select auth.uid())
    )
  );

drop policy if exists mezgeb_audit_logs_owner_select on public.mezgeb_audit_logs;
create policy mezgeb_audit_logs_owner_select
  on public.mezgeb_audit_logs for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.mezgeb_businesses b
      where b.id = mezgeb_audit_logs.business_id
        and b.owner_id = (select auth.uid())
    )
  );

drop policy if exists mezgeb_deletion_requests_own on public.mezgeb_deletion_requests;
create policy mezgeb_deletion_requests_own
  on public.mezgeb_deletion_requests for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, update on public.mezgeb_profiles to authenticated;
grant select, insert, update, delete on public.mezgeb_businesses to authenticated;
grant select, insert, update, delete on public.mezgeb_customers to authenticated;
grant select, insert, update, delete on public.mezgeb_transactions to authenticated;
grant select, insert, update, delete on public.mezgeb_receipts to authenticated;
grant select on public.mezgeb_audit_logs to authenticated;
grant select, insert, update, delete on public.mezgeb_deletion_requests to authenticated;
grant usage, select on sequence public.mezgeb_audit_logs_id_seq to authenticated;

insert into public.mezgeb_profiles (id, full_name)
select id, coalesce(raw_user_meta_data->>'full_name', '')
from auth.users
on conflict (id) do nothing;
