-- Replace the launch Free/Pro catalogue with Mezgeb's confirmed commercial tiers.
-- Paid activation remains provider-controlled; this migration does not claim payment success.

insert into public.mezgeb_plans (
  code, name, description, monthly_price_etb, annual_price_etb, features,
  is_active, sort_order, trial_days, is_featured, limits
) values
  (
    'starter',
    'Starter',
    'A dependable digital operating record for a small business.',
    1500,
    15000,
    '["Sales and expense ledger","Dube customer credit","VAT-aware receipts","Core business reports","Cross-device Supabase sync","Email support"]'::jsonb,
    true,
    10,
    14,
    false,
    '{"audience":"Small businesses moving from notebooks and scattered messages","capacity":"1 business workspace","custom_pricing":false}'::jsonb
  ),
  (
    'growth',
    'Growth',
    'More control for an expanding operation and multiple workspaces.',
    4500,
    45000,
    '["Everything in Starter","Unlimited receipt records","Advanced business reports","Multi-business switching","Priority onboarding","Priority support"]'::jsonb,
    true,
    20,
    14,
    true,
    '{"audience":"Growing businesses that need stronger reporting and support","capacity":"Up to 10 business workspaces","custom_pricing":false}'::jsonb
  ),
  (
    'business',
    'Business',
    'A guided commercial setup for established companies.',
    9500,
    95000,
    '["Everything in Growth","Guided data migration","Dedicated onboarding","Business configuration review","Priority implementation support","Commercial account setup"]'::jsonb,
    true,
    30,
    0,
    false,
    '{"audience":"Established businesses coordinating larger operations","capacity":"Commercial implementation","custom_pricing":false}'::jsonb
  ),
  (
    'enterprise',
    'Enterprise',
    'A scoped deployment for complex workflows and integrations.',
    0,
    0,
    '["Custom deployment planning","Integration and API planning","Complex migration support","Custom roles and approval planning","Dedicated implementation management","Commercial terms based on scope"]'::jsonb,
    true,
    40,
    0,
    false,
    '{"audience":"Organizations requiring tailored implementation and governance","capacity":"Custom organization scope","custom_pricing":true}'::jsonb
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

-- Give existing launch accounts a real Starter/Growth trial instead of silently
-- converting them into paid active subscriptions.
update public.mezgeb_subscriptions
set
  plan_code = case when plan_code = 'pro' then 'growth' else 'starter' end,
  amount_etb = case
    when plan_code = 'pro' and billing_cycle = 'annual' then 45000
    when plan_code = 'pro' then 4500
    when billing_cycle = 'annual' then 15000
    else 1500
  end,
  status = case when provider is null then 'trialing' else status end,
  trial_started_at = case when provider is null then coalesce(trial_started_at, now()) else trial_started_at end,
  trial_ends_at = case when provider is null then coalesce(trial_ends_at, now() + interval '14 days') else trial_ends_at end,
  current_period_start = case when provider is null then coalesce(trial_started_at, now()) else current_period_start end,
  current_period_end = case when provider is null then coalesce(trial_ends_at, now() + interval '14 days') else current_period_end end,
  updated_at = now()
where plan_code in ('free', 'pro');

update public.mezgeb_plans
set is_active = false, updated_at = now()
where code in ('free', 'pro');

create or replace function public.handle_new_mezgeb_subscription()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.mezgeb_subscriptions (
    user_id,
    plan_code,
    billing_cycle,
    status,
    amount_etb,
    currency,
    trial_started_at,
    trial_ends_at,
    current_period_start,
    current_period_end
  )
  values (
    new.id,
    'starter',
    'monthly',
    'trialing',
    1500,
    'ETB',
    now(),
    now() + interval '14 days',
    now(),
    now() + interval '14 days'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

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
  if acting_user is null then
    raise exception 'Authentication required';
  end if;

  select * into selected_plan
  from public.mezgeb_plans
  where code = new.plan_code and is_active = true;

  if not found then
    raise exception 'The selected Mezgeb plan is unavailable';
  end if;

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
  new.updated_at := now();

  if tg_op = 'INSERT' then
    new.created_at := now();
    new.provider := null;
    new.provider_customer_id := null;
    new.provider_subscription_id := null;
    new.cancel_at_period_end := false;
    new.canceled_at := null;

    if selected_plan.trial_days > 0 then
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

  if old.user_id <> acting_user then
    raise exception 'Subscription ownership cannot be changed';
  end if;

  new.id := old.id;
  new.created_at := old.created_at;

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

comment on table public.mezgeb_plans is 'Supabase-managed Starter, Growth, Business and Enterprise catalogue displayed by Mezgeb.';
comment on table public.mezgeb_subscriptions is 'User plan selection normalized by the database; paid activation requires a verified provider webhook.';
