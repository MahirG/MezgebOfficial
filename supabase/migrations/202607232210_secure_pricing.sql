-- Supabase-backed pricing catalogue and secure user plan selection.
-- Payment activation remains server/provider controlled.

create table if not exists public.mezgeb_plans (
  code text primary key,
  name text not null,
  description text not null default '',
  monthly_price_etb numeric(14,2) not null default 0 check (monthly_price_etb >= 0),
  annual_price_etb numeric(14,2) not null default 0 check (annual_price_etb >= 0),
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  trial_days integer not null default 0 check (trial_days between 0 and 30),
  is_featured boolean not null default false,
  limits jsonb not null default '{}'::jsonb check (jsonb_typeof(limits) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mezgeb_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_id uuid references public.mezgeb_businesses(id) on delete set null,
  plan_code text not null references public.mezgeb_plans(code) on delete restrict,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','annual')),
  status text not null default 'active' check (status in ('active','trialing','pending_payment','past_due','cancelled')),
  amount_etb numeric(14,2) not null default 0 check (amount_etb >= 0),
  currency text not null default 'ETB' check (currency = 'ETB'),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mezgeb_plans
  add column if not exists trial_days integer not null default 0 check (trial_days between 0 and 30),
  add column if not exists is_featured boolean not null default false,
  add column if not exists limits jsonb not null default '{}'::jsonb check (jsonb_typeof(limits) = 'object');

alter table public.mezgeb_subscriptions
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists canceled_at timestamptz;

insert into public.mezgeb_plans (
  code, name, description, monthly_price_etb, annual_price_etb, features,
  is_active, sort_order, trial_days, is_featured, limits
) values
  (
    'free', 'Free', 'For starting a digital daily ledger.', 0, 0,
    '["Sales and expense ledger","Dube credit book","Basic reports","Up to 30 VAT receipts"]'::jsonb,
    true, 10, 0, false,
    '{"businesses":1,"vat_receipts_per_month":30,"advanced_reports":false,"priority_support":false}'::jsonb
  ),
  (
    'pro', 'Mezgeb Pro', 'For growing businesses needing more control.', 299, 2990,
    '["Unlimited VAT receipts","Advanced reports","Cross-device sync","Up to 10 businesses","Priority support"]'::jsonb,
    true, 20, 7, true,
    '{"businesses":10,"vat_receipts_per_month":null,"advanced_reports":true,"priority_support":true}'::jsonb
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price_etb = excluded.monthly_price_etb,
  annual_price_etb = excluded.annual_price_etb,
  features = excluded.features,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  trial_days = excluded.trial_days,
  is_featured = excluded.is_featured,
  limits = excluded.limits,
  updated_at = now();

create or replace function public.mezgeb_secure_subscription_selection()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  selected_plan public.mezgeb_plans%rowtype;
  acting_user uuid;
  selected_amount numeric(14,2);
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or (select auth.role()) = 'service_role' then
    return new;
  end if;

  acting_user := (select auth.uid());
  if acting_user is null then raise exception 'Authentication required'; end if;

  select * into selected_plan
  from public.mezgeb_plans
  where code = new.plan_code and is_active = true;
  if not found then raise exception 'The selected Mezgeb plan is unavailable'; end if;

  if new.billing_cycle not in ('monthly', 'annual') then
    raise exception 'Unsupported billing cycle';
  end if;

  selected_amount := case
    when new.billing_cycle = 'annual' then selected_plan.annual_price_etb
    else selected_plan.monthly_price_etb
  end;

  new.user_id := acting_user;
  new.currency := 'ETB';
  new.amount_etb := selected_amount;

  if tg_op = 'INSERT' then
    new.provider := null;
    new.provider_customer_id := null;
    new.provider_subscription_id := null;
    new.cancel_at_period_end := false;
    new.canceled_at := null;

    if selected_plan.code = 'free' then
      new.status := 'active';
      new.current_period_start := now();
      new.current_period_end := null;
      new.trial_started_at := null;
      new.trial_ends_at := null;
    elsif selected_plan.trial_days > 0 then
      new.status := 'trialing';
      new.trial_started_at := now();
      new.trial_ends_at := now() + make_interval(days => selected_plan.trial_days);
      new.current_period_start := new.trial_started_at;
      new.current_period_end := new.trial_ends_at;
    else
      new.status := 'pending_payment';
      new.current_period_start := null;
      new.current_period_end := null;
      new.trial_started_at := null;
      new.trial_ends_at := null;
    end if;
    return new;
  end if;

  if old.user_id <> acting_user then raise exception 'Subscription ownership cannot be changed'; end if;

  if selected_plan.code = 'free' then
    new.status := 'active';
    new.provider := null;
    new.provider_customer_id := null;
    new.provider_subscription_id := null;
    new.current_period_start := now();
    new.current_period_end := null;
    new.cancel_at_period_end := false;
    new.canceled_at := null;
    new.trial_started_at := old.trial_started_at;
    new.trial_ends_at := old.trial_ends_at;
    return new;
  end if;

  if old.plan_code = selected_plan.code then
    new.status := old.status;
    new.provider := old.provider;
    new.provider_customer_id := old.provider_customer_id;
    new.provider_subscription_id := old.provider_subscription_id;
    new.current_period_start := old.current_period_start;
    new.current_period_end := old.current_period_end;
    new.cancel_at_period_end := old.cancel_at_period_end;
    new.canceled_at := old.canceled_at;
    new.trial_started_at := old.trial_started_at;
    new.trial_ends_at := old.trial_ends_at;
    return new;
  end if;

  new.provider := null;
  new.provider_customer_id := null;
  new.provider_subscription_id := null;
  new.cancel_at_period_end := false;
  new.canceled_at := null;

  if old.trial_started_at is null and selected_plan.trial_days > 0 then
    new.status := 'trialing';
    new.trial_started_at := now();
    new.trial_ends_at := now() + make_interval(days => selected_plan.trial_days);
    new.current_period_start := new.trial_started_at;
    new.current_period_end := new.trial_ends_at;
  else
    new.status := 'pending_payment';
    new.trial_started_at := old.trial_started_at;
    new.trial_ends_at := old.trial_ends_at;
    new.current_period_start := null;
    new.current_period_end := null;
  end if;
  return new;
end;
$$;

revoke all on function public.mezgeb_secure_subscription_selection() from public, anon, authenticated, service_role;

drop trigger if exists mezgeb_secure_subscription_selection on public.mezgeb_subscriptions;
create trigger mezgeb_secure_subscription_selection
before insert or update on public.mezgeb_subscriptions
for each row execute procedure public.mezgeb_secure_subscription_selection();

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
  and (business_id is null or exists (
    select 1 from public.mezgeb_businesses b
    where b.id = mezgeb_subscriptions.business_id and b.owner_id = (select auth.uid())
  ))
);

drop policy if exists mezgeb_subscriptions_update_own on public.mezgeb_subscriptions;
create policy mezgeb_subscriptions_update_own on public.mezgeb_subscriptions
for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (business_id is null or exists (
    select 1 from public.mezgeb_businesses b
    where b.id = mezgeb_subscriptions.business_id and b.owner_id = (select auth.uid())
  ))
);

revoke all on table public.mezgeb_plans from anon, authenticated;
grant select on table public.mezgeb_plans to anon, authenticated;
revoke all on table public.mezgeb_subscriptions from anon, authenticated;
grant select, insert, update on table public.mezgeb_subscriptions to authenticated;

comment on table public.mezgeb_plans is 'Supabase-managed Mezgeb plan catalogue displayed by the website.';
comment on table public.mezgeb_subscriptions is 'User plan selection. Client writes are normalized by a database trigger; paid activation requires a verified provider webhook.';
