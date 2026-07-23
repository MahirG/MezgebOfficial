create table if not exists public.mezgeb_plans (
  code text primary key,
  name text not null,
  description text not null,
  monthly_price_etb numeric(12,2) not null default 0 check (monthly_price_etb >= 0),
  annual_price_etb numeric(12,2) not null default 0 check (annual_price_etb >= 0),
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mezgeb_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_id uuid references public.mezgeb_businesses(id) on delete set null,
  plan_code text not null references public.mezgeb_plans(code),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','annual')),
  status text not null default 'active' check (status in ('active','trialing','pending_payment','past_due','cancelled')),
  amount_etb numeric(12,2) not null default 0 check (amount_etb >= 0),
  currency text not null default 'ETB' check (currency = 'ETB'),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mezgeb_subscriptions_business_idx
  on public.mezgeb_subscriptions(business_id) where business_id is not null;
create index if not exists mezgeb_subscriptions_plan_status_idx
  on public.mezgeb_subscriptions(plan_code, status);

insert into public.mezgeb_plans(code, name, description, monthly_price_etb, annual_price_etb, features, sort_order)
values
  ('free', 'Free', 'For starting a digital daily ledger.', 0, 0,
    '["Sales and expense ledger","Dube credit book","Basic reports","Up to 30 VAT receipts"]'::jsonb, 10),
  ('pro', 'Mezgeb Pro', 'For growing businesses needing more control.', 299, 2990,
    '["Unlimited VAT receipts","Advanced reports","Cross-device sync","Up to 10 businesses","Priority support"]'::jsonb, 20)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price_etb = excluded.monthly_price_etb,
  annual_price_etb = excluded.annual_price_etb,
  features = excluded.features,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

alter table public.mezgeb_plans enable row level security;
alter table public.mezgeb_subscriptions enable row level security;

drop policy if exists mezgeb_plans_public_read on public.mezgeb_plans;
create policy mezgeb_plans_public_read on public.mezgeb_plans
for select to anon, authenticated using (is_active = true);

drop policy if exists mezgeb_subscriptions_select_own on public.mezgeb_subscriptions;
create policy mezgeb_subscriptions_select_own on public.mezgeb_subscriptions
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists mezgeb_subscriptions_insert_own on public.mezgeb_subscriptions;
create policy mezgeb_subscriptions_insert_own on public.mezgeb_subscriptions
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    business_id is null
    or exists (
      select 1 from public.mezgeb_businesses b
      where b.id = mezgeb_subscriptions.business_id
        and b.owner_id = (select auth.uid())
    )
  )
);

drop policy if exists mezgeb_subscriptions_update_own on public.mezgeb_subscriptions;
create policy mezgeb_subscriptions_update_own on public.mezgeb_subscriptions
for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (
    business_id is null
    or exists (
      select 1 from public.mezgeb_businesses b
      where b.id = mezgeb_subscriptions.business_id
        and b.owner_id = (select auth.uid())
    )
  )
);

drop trigger if exists mezgeb_plans_updated_at on public.mezgeb_plans;
create trigger mezgeb_plans_updated_at before update on public.mezgeb_plans
for each row execute procedure public.mezgeb_set_updated_at();

drop trigger if exists mezgeb_subscriptions_updated_at on public.mezgeb_subscriptions;
create trigger mezgeb_subscriptions_updated_at before update on public.mezgeb_subscriptions
for each row execute procedure public.mezgeb_set_updated_at();

grant select on public.mezgeb_plans to anon, authenticated;
grant select, insert, update on public.mezgeb_subscriptions to authenticated;

comment on table public.mezgeb_subscriptions is
  'Stores the user-selected Mezgeb plan. Paid plans remain pending_payment until a verified payment provider confirms payment.';
comment on column public.mezgeb_subscriptions.status is
  'Free plans may be active immediately. Paid plans must remain pending_payment until verified by a payment provider webhook.';
