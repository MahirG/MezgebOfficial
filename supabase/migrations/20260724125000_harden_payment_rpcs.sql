revoke all on function public.mezgeb_create_payment_intent(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.mezgeb_attach_payment_checkout(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.mezgeb_mark_payment_failed(text, text) from public, anon, authenticated;
revoke all on function public.mezgeb_finalize_verified_payment(text, text, numeric, text, text, jsonb) from public, anon, authenticated;

drop function if exists public.mezgeb_create_payment_intent(text, text, text, text, text);
drop function if exists public.mezgeb_attach_payment_checkout(text, text, text, jsonb);
drop function if exists public.mezgeb_mark_payment_failed(text, text);

create or replace function public.mezgeb_create_payment_intent(
  p_user_id uuid,
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
  selected_plan public.mezgeb_plans%rowtype;
  existing_intent public.mezgeb_payment_intents%rowtype;
  existing_subscription public.mezgeb_subscriptions%rowtype;
  selected_amount numeric(14,2);
  subscription_id uuid;
  result public.mezgeb_payment_intents%rowtype;
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin')
     and (select auth.role()) <> 'service_role' then
    raise exception 'Service role required';
  end if;

  if p_user_id is null or not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Unknown Mezgeb account';
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
  where user_id = p_user_id and idempotency_key = p_idempotency_key;

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
  where user_id = p_user_id
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
      p_user_id, p_plan_code, p_billing_cycle, 'pending_payment', selected_amount, 'ETB', 'chapa'
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
    p_user_id,
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
  result public.mezgeb_payment_intents%rowtype;
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin')
     and (select auth.role()) <> 'service_role' then
    raise exception 'Service role required';
  end if;

  if p_checkout_url !~ '^https://[^[:space:]]+$' then
    raise exception 'Invalid checkout URL';
  end if;

  update public.mezgeb_payment_intents
  set checkout_url = p_checkout_url,
      provider_reference = nullif(p_provider_reference, ''),
      provider_payload = coalesce(p_payload, '{}'::jsonb),
      status = 'pending',
      updated_at = now()
  where tx_ref = p_tx_ref
    and status in ('created', 'pending')
    and expires_at > now()
  returning * into result;

  if result.id is null then
    raise exception 'Payment intent is unavailable or expired';
  end if;

  return result;
end;
$$;

create or replace function public.mezgeb_mark_payment_failed(
  p_tx_ref text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin')
     and (select auth.role()) <> 'service_role' then
    raise exception 'Service role required';
  end if;

  update public.mezgeb_payment_intents
  set status = 'failed',
      failure_reason = left(coalesce(p_reason, 'Checkout initialization failed'), 500),
      updated_at = now()
  where tx_ref = p_tx_ref
    and status in ('created', 'pending');
end;
$$;

revoke all on function public.mezgeb_create_payment_intent(uuid, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.mezgeb_attach_payment_checkout(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.mezgeb_mark_payment_failed(text, text) from public, anon, authenticated;
revoke all on function public.mezgeb_finalize_verified_payment(text, text, numeric, text, text, jsonb) from public, anon, authenticated;

grant execute on function public.mezgeb_create_payment_intent(uuid, text, text, text, text, text) to service_role;
grant execute on function public.mezgeb_attach_payment_checkout(text, text, text, jsonb) to service_role;
grant execute on function public.mezgeb_mark_payment_failed(text, text) to service_role;
grant execute on function public.mezgeb_finalize_verified_payment(text, text, numeric, text, text, jsonb) to service_role;
