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

  if tg_op = 'INSERT' then
    new.created_at := now();
    new.updated_at := now();
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

  if old.user_id <> acting_user then
    raise exception 'Subscription ownership cannot be changed';
  end if;

  new.id := old.id;
  new.created_at := old.created_at;

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
