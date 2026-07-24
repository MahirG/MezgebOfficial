create table if not exists public.mezgeb_payment_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.mezgeb_subscriptions(id) on delete set null,
  plan_code text not null references public.mezgeb_plans(code),
  billing_cycle text not null check (billing_cycle in ('monthly', 'annual')),
  amount_etb numeric(14,2) not null check (amount_etb > 0),
  currency text not null default 'ETB' check (currency = 'ETB'),
  payment_method text not null check (payment_method in ('telebirr', 'mpesa', 'cbe_birr', 'amole', 'kacha', 'chapa')),
  provider text not null default 'chapa' check (provider = 'chapa'),
  tx_ref text not null unique,
  idempotency_key text not null unique,
  provider_reference text,
  checkout_url text,
  status text not null default 'created' check (status in ('created', 'pending', 'paid', 'failed', 'cancelled', 'expired', 'refunded')),
  failure_reason text,
  provider_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(provider_payload) = 'object'),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mezgeb_payment_intents_user_created_idx
  on public.mezgeb_payment_intents(user_id, created_at desc);
create index if not exists mezgeb_payment_intents_subscription_idx
  on public.mezgeb_payment_intents(subscription_id, status);
create index if not exists mezgeb_payment_intents_provider_reference_idx
  on public.mezgeb_payment_intents(provider_reference)
  where provider_reference is not null;

alter table public.mezgeb_payment_intents enable row level security;

drop policy if exists mezgeb_payment_intents_select_own on public.mezgeb_payment_intents;
create policy mezgeb_payment_intents_select_own
  on public.mezgeb_payment_intents
  for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke insert, update, delete on public.mezgeb_payment_intents from anon, authenticated;
grant select on public.mezgeb_payment_intents to authenticated;

create or replace function public.mezgeb_create_payment_intent(
  p_plan_code text,
  p_billing_cycle text,
  p_payment_method text,
  p_tx_ref text,
  p_idempotency_key text
)
returns public.mezgeb_payment_intents
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  acting_user uuid := (select auth.uid());
  selected_plan public.mezgeb_plans%rowtype;
  existing_intent public.mezgeb_payment_intents%rowtype;
  existing_subscription public.mezgeb_subscriptions%rowtype;
  selected_amount numeric(14,2);
  subscription_id uuid;
  result public.mezgeb_payment_intents%rowtype;
begin
  if acting_user is null then
    raise exception 'Authentication required';
  end if;

  if p_billing_cycle not in ('monthly', 'annual') then
    raise exception 'Unsupported billing cycle';
  end if;

  if p_payment_method not in ('telebirr', 'mpesa', 'cbe_birr', 'amole', 'kacha', 'chapa') then
    raise exception 'Unsupported payment method';
  end if;

  if p_tx_ref !~ '^MEZGEB-[A-Za-z0-9-]{12,80}$' or length(p_idempotency_key) < 16 then
    raise exception 'Invalid payment reference';
  end if;

  select * into existing_intent
  from public.mezgeb_payment_intents
  where user_id = acting_user and idempotency_key = p_idempotency_key;

  if found then
    return existing_intent;
  end if;

  select * into selected_plan
  from public.mezgeb_plans
  where code = p_plan_code and is_active = true;

  if not found or coalesce((selected_plan.limits ->> 'custom_pricing')::boolean, false) then
    raise exception 'The selected Mezgeb plan is unavailable for online checkout';
  end if;

  selected_amount := case
    when p_billing_cycle = 'annual' then selected_plan.annual_price_etb
    else selected_plan.monthly_price_etb
  end;

  if selected_amount <= 0 then
    raise exception 'The selected plan does not have a payable ETB amount';
  end if;

  select * into existing_subscription
  from public.mezgeb_subscriptions
  where user_id = acting_user
  for update;

  if found then
    update public.mezgeb_subscriptions
    set plan_code = p_plan_code,
        billing_cycle = p_billing_cycle,
        amount_etb = selected_amount,
        currency = 'ETB',
        provider = 'chapa',
        status = case
          when existing_subscription.status = 'active'
            and existing_subscription.plan_code = p_plan_code
            and existing_subscription.billing_cycle = p_billing_cycle
          then 'active'
          else 'pending_payment'
        end,
        updated_at = now()
    where id = existing_subscription.id
    returning id into subscription_id;
  else
    insert into public.mezgeb_subscriptions (
      user_id, plan_code, billing_cycle, status, amount_etb, currency, provider
    ) values (
      acting_user, p_plan_code, p_billing_cycle, 'pending_payment', selected_amount, 'ETB', 'chapa'
    ) returning id into subscription_id;
  end if;

  insert into public.mezgeb_payment_intents (
    user_id,
    subscription_id,
    plan_code,
    billing_cycle,
    amount_etb,
    currency,
    payment_method,
    provider,
    tx_ref,
    idempotency_key
  ) values (
    acting_user,
    subscription_id,
    p_plan_code,
    p_billing_cycle,
    selected_amount,
    'ETB',
    p_payment_method,
    'chapa',
    p_tx_ref,
    p_idempotency_key
  ) returning * into result;

  return result;
end;
$$;

revoke all on function public.mezgeb_create_payment_intent(text, text, text, text, text) from public;
grant execute on function public.mezgeb_create_payment_intent(text, text, text, text, text) to authenticated;

create or replace function public.mezgeb_attach_payment_checkout(
  p_tx_ref text,
  p_checkout_url text,
  p_provider_reference text,
  p_payload jsonb
)
returns public.mezgeb_payment_intents
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  acting_user uuid := (select auth.uid());
  result public.mezgeb_payment_intents%rowtype;
begin
  if acting_user is null then
    raise exception 'Authentication required';
  end if;

  update public.mezgeb_payment_intents
  set checkout_url = p_checkout_url,
      provider_reference = nullif(p_provider_reference, ''),
      provider_payload = coalesce(p_payload, '{}'::jsonb),
      status = 'pending',
      updated_at = now()
  where tx_ref = p_tx_ref
    and user_id = acting_user
    and status in ('created', 'pending')
    and expires_at > now()
  returning * into result;

  if result.id is null then
    raise exception 'Payment intent is unavailable or expired';
  end if;

  return result;
end;
$$;

revoke all on function public.mezgeb_attach_payment_checkout(text, text, text, jsonb) from public;
grant execute on function public.mezgeb_attach_payment_checkout(text, text, text, jsonb) to authenticated;

create or replace function public.mezgeb_mark_payment_failed(
  p_tx_ref text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  acting_user uuid := (select auth.uid());
begin
  if acting_user is null then
    raise exception 'Authentication required';
  end if;

  update public.mezgeb_payment_intents
  set status = 'failed',
      failure_reason = left(coalesce(p_reason, 'Checkout initialization failed'), 500),
      updated_at = now()
  where tx_ref = p_tx_ref
    and user_id = acting_user
    and status in ('created', 'pending');
end;
$$;

revoke all on function public.mezgeb_mark_payment_failed(text, text) from public;
grant execute on function public.mezgeb_mark_payment_failed(text, text) to authenticated;

create or replace function public.mezgeb_finalize_verified_payment(
  p_tx_ref text,
  p_provider_reference text,
  p_amount numeric,
  p_currency text,
  p_status text,
  p_payload jsonb
)
returns public.mezgeb_payment_intents
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  intent public.mezgeb_payment_intents%rowtype;
  normalized_status text := lower(coalesce(p_status, ''));
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin')
     and (select auth.role()) <> 'service_role' then
    raise exception 'Service role required';
  end if;

  select * into intent
  from public.mezgeb_payment_intents
  where tx_ref = p_tx_ref
  for update;

  if not found then
    raise exception 'Unknown payment reference';
  end if;

  if intent.status = 'paid' then
    return intent;
  end if;

  if normalized_status not in ('success', 'successful', 'paid') then
    update public.mezgeb_payment_intents
    set status = 'failed',
        failure_reason = 'Provider verification returned ' || coalesce(p_status, 'unknown'),
        provider_payload = coalesce(p_payload, '{}'::jsonb),
        updated_at = now()
    where id = intent.id
    returning * into intent;
    return intent;
  end if;

  if upper(coalesce(p_currency, '')) <> intent.currency
     or round(coalesce(p_amount, 0), 2) <> round(intent.amount_etb, 2) then
    raise exception 'Verified payment amount or currency does not match the payment intent';
  end if;

  update public.mezgeb_payment_intents
  set status = 'paid',
      provider_reference = coalesce(nullif(p_provider_reference, ''), provider_reference),
      provider_payload = coalesce(p_payload, '{}'::jsonb),
      failure_reason = null,
      paid_at = coalesce(paid_at, now()),
      updated_at = now()
  where id = intent.id
  returning * into intent;

  update public.mezgeb_subscriptions
  set plan_code = intent.plan_code,
      billing_cycle = intent.billing_cycle,
      status = 'active',
      amount_etb = intent.amount_etb,
      currency = intent.currency,
      provider = 'chapa',
      provider_subscription_id = intent.tx_ref,
      current_period_start = now(),
      current_period_end = case
        when intent.billing_cycle = 'annual' then now() + interval '1 year'
        else now() + interval '1 month'
      end,
      trial_ends_at = null,
      cancel_at_period_end = false,
      canceled_at = null,
      updated_at = now()
  where id = intent.subscription_id
    and user_id = intent.user_id;

  return intent;
end;
$$;

revoke all on function public.mezgeb_finalize_verified_payment(text, text, numeric, text, text, jsonb) from public;
grant execute on function public.mezgeb_finalize_verified_payment(text, text, numeric, text, text, jsonb) to service_role;

create or replace trigger mezgeb_payment_intents_updated_at
before update on public.mezgeb_payment_intents
for each row execute function public.mezgeb_set_updated_at();
