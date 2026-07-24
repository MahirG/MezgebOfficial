-- Production workspace, onboarding, Dube and product analytics.

alter table public.mezgeb_businesses
  add column if not exists region text,
  add column if not exists opening_balance numeric(14,2) not null default 0,
  add column if not exists fiscal_year_start_month smallint not null default 1,
  add column if not exists receipt_prefix text not null default 'R',
  add column if not exists onboarding_completed_at timestamptz;

alter table public.mezgeb_businesses
  drop constraint if exists mezgeb_businesses_opening_balance_check,
  add constraint mezgeb_businesses_opening_balance_check check (opening_balance >= 0),
  drop constraint if exists mezgeb_businesses_fiscal_year_start_month_check,
  add constraint mezgeb_businesses_fiscal_year_start_month_check check (fiscal_year_start_month between 1 and 12),
  drop constraint if exists mezgeb_businesses_receipt_prefix_check,
  add constraint mezgeb_businesses_receipt_prefix_check check (receipt_prefix ~ '^[A-Z0-9-]{1,10}$');

alter table public.mezgeb_transactions
  add column if not exists category text,
  add column if not exists reference text,
  add column if not exists notes text,
  add column if not exists due_at timestamptz;

alter table public.mezgeb_profiles
  add column if not exists product_tour_step smallint not null default 0,
  add column if not exists product_tour_completed_at timestamptz;

alter table public.mezgeb_profiles
  drop constraint if exists mezgeb_profiles_product_tour_step_check,
  add constraint mezgeb_profiles_product_tour_step_check check (product_tour_step between 0 and 5);

create table if not exists public.mezgeb_analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  business_id uuid references public.mezgeb_businesses(id) on delete cascade,
  event_name text not null check (char_length(event_name) between 2 and 80),
  source text not null default 'web' check (source in ('web','app','server')),
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mezgeb_analytics_events_user_date_idx on public.mezgeb_analytics_events(user_id, created_at desc);
create index if not exists mezgeb_analytics_events_business_date_idx on public.mezgeb_analytics_events(business_id, created_at desc) where business_id is not null;
create index if not exists mezgeb_transactions_business_type_date_idx on public.mezgeb_transactions(business_id, type, occurred_at desc);
create index if not exists mezgeb_transactions_due_idx on public.mezgeb_transactions(business_id, due_at) where due_at is not null;

alter table public.mezgeb_analytics_events enable row level security;

drop policy if exists mezgeb_analytics_events_select_own on public.mezgeb_analytics_events;
create policy mezgeb_analytics_events_select_own on public.mezgeb_analytics_events for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists mezgeb_analytics_events_insert_own on public.mezgeb_analytics_events;
create policy mezgeb_analytics_events_insert_own on public.mezgeb_analytics_events for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    business_id is null
    or exists (
      select 1 from public.mezgeb_businesses b
      where b.id = mezgeb_analytics_events.business_id
        and b.owner_id = (select auth.uid())
    )
  )
);

grant select, insert on public.mezgeb_analytics_events to authenticated;
grant usage, select on sequence public.mezgeb_analytics_events_id_seq to authenticated;
grant select, insert, update, delete on public.mezgeb_businesses to authenticated;
grant select, insert, update, delete on public.mezgeb_transactions to authenticated;
grant update (product_tour_step, product_tour_completed_at) on public.mezgeb_profiles to authenticated;

create or replace view public.mezgeb_customer_balances with (security_invoker = true) as
select
  c.id,
  c.business_id,
  c.name,
  c.phone,
  c.notes,
  c.credit_limit,
  coalesce(sum(case when t.type = 'credit_sale' then t.amount when t.type = 'credit_payment' then -t.amount else 0 end), 0)::numeric(14,2) as balance,
  max(t.occurred_at) as last_activity_at,
  min(t.due_at) filter (where t.type = 'credit_sale' and t.due_at is not null) as earliest_due_at
from public.mezgeb_customers c
left join public.mezgeb_transactions t on t.customer_id = c.id
  and t.business_id = c.business_id
  and t.type in ('credit_sale','credit_payment')
group by c.id, c.business_id, c.name, c.phone, c.notes, c.credit_limit;

grant select on public.mezgeb_customer_balances to authenticated;

create or replace function public.mezgeb_complete_onboarding(
  p_name text,
  p_business_type text default 'other',
  p_region text default null,
  p_city text default null,
  p_phone text default null,
  p_tin text default null,
  p_vat_registered boolean default false,
  p_opening_balance numeric default 0,
  p_fiscal_year_start_month integer default 1,
  p_receipt_prefix text default 'R'
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_business_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_type text := lower(btrim(coalesce(p_business_type, 'other')));
  v_prefix text := upper(btrim(coalesce(p_receipt_prefix, 'R')));
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120 then raise exception 'Business name must contain 2 to 120 characters'; end if;
  if v_type not in ('cafe_restaurant','retail','wholesale','service','manufacturing','agriculture','transport','professional','other') then raise exception 'Unsupported business type'; end if;
  if coalesce(p_opening_balance, 0) < 0 then raise exception 'Opening balance cannot be negative'; end if;
  if coalesce(p_fiscal_year_start_month, 1) not between 1 and 12 then raise exception 'Fiscal year month must be between 1 and 12'; end if;
  if v_prefix !~ '^[A-Z0-9-]{1,10}$' then raise exception 'Receipt prefix must contain only letters, numbers or hyphens'; end if;

  insert into public.mezgeb_businesses (
    owner_id, name, business_type, region, city, phone, tin, vat_registered,
    opening_balance, fiscal_year_start_month, receipt_prefix, onboarding_completed_at
  ) values (
    v_user_id, v_name, v_type, nullif(btrim(p_region), ''), nullif(btrim(p_city), ''),
    nullif(btrim(p_phone), ''), nullif(btrim(p_tin), ''), coalesce(p_vat_registered, false),
    coalesce(p_opening_balance, 0), coalesce(p_fiscal_year_start_month, 1), v_prefix, now()
  ) returning id into v_business_id;

  if coalesce(p_opening_balance, 0) > 0 then
    insert into public.mezgeb_transactions (
      business_id, type, description, amount, vat_amount, payment_method,
      category, reference, created_by
    ) values (
      v_business_id, 'adjustment', 'Opening cash balance', p_opening_balance,
      0, 'cash', 'opening_balance', 'ONBOARDING', v_user_id
    );
  end if;

  update public.mezgeb_profiles
  set last_business_id = v_business_id,
      product_tour_step = 0,
      product_tour_completed_at = null,
      updated_at = now()
  where id = v_user_id;

  insert into public.mezgeb_analytics_events (user_id, business_id, event_name, source, properties)
  values (
    v_user_id, v_business_id, 'onboarding_completed', 'server',
    jsonb_build_object('business_type', v_type, 'vat_registered', coalesce(p_vat_registered, false))
  );

  return v_business_id;
end;
$$;

revoke all on function public.mezgeb_complete_onboarding(text,text,text,text,text,text,boolean,numeric,integer,text) from public, anon, authenticated;
grant execute on function public.mezgeb_complete_onboarding(text,text,text,text,text,text,boolean,numeric,integer,text) to authenticated;
