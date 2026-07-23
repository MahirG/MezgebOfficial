-- Mezgeb initial production schema. Apply only to a dedicated Mezgeb Supabase project.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  preferred_language text not null default 'en' check (preferred_language in ('en','am')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.businesses (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null, tin text, phone text, city text, vat_registered boolean not null default false,
  currency text not null default 'ETB', created_at timestamptz not null default now()
);
create table public.customers (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, phone text, notes text, created_at timestamptz not null default now()
);
create type public.transaction_type as enum ('sale','expense','credit_sale','credit_payment','supplier_purchase','adjustment');
create table public.transactions (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null, type public.transaction_type not null,
  description text not null, amount numeric(14,2) not null check (amount >= 0), vat_amount numeric(14,2) not null default 0 check (vat_amount >= 0),
  payment_method text not null default 'cash', occurred_at timestamptz not null default now(), created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.receipts (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null, receipt_number text not null,
  subtotal numeric(14,2) not null, vat_amount numeric(14,2) not null default 0, total numeric(14,2) not null,
  status text not null default 'issued', issued_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
  unique (business_id, receipt_number)
);
create table public.waitlist (
  id bigint generated always as identity primary key, name text not null, contact text not null,
  business_type text, city text, consent boolean not null default false, created_at timestamptz not null default now()
);
create table public.audit_logs (
  id bigint generated always as identity primary key, user_id uuid references auth.users(id) on delete set null,
  business_id uuid references public.businesses(id) on delete cascade, action text not null, entity_type text not null,
  entity_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'requested', requested_at timestamptz not null default now(), completed_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.customers enable row level security;
alter table public.transactions enable row level security;
alter table public.receipts enable row level security;
alter table public.waitlist enable row level security;
alter table public.audit_logs enable row level security;
alter table public.deletion_requests enable row level security;

create policy "profiles own row" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "business owners" on public.businesses for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "customers through owned business" on public.customers for all using (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid())) with check (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()));
create policy "transactions through owned business" on public.transactions for all using (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid())) with check (created_by=auth.uid() and exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()));
create policy "receipts through owned business" on public.receipts for all using (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid())) with check (created_by=auth.uid() and exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()));
create policy "audit logs through owned business" on public.audit_logs for select using (user_id=auth.uid() or exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()));
create policy "deletion requests own row" on public.deletion_requests for all using (user_id=auth.uid()) with check (user_id=auth.uid());
-- No public waitlist policies. Server-side service role is required for inserts.

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id, full_name) values(new.id, coalesce(new.raw_user_meta_data->>'full_name','')); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
