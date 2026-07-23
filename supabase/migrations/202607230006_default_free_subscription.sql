create or replace function public.handle_new_mezgeb_subscription()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.mezgeb_subscriptions (
    user_id, plan_code, billing_cycle, status, amount_etb, currency
  )
  values (new.id, 'free', 'monthly', 'active', 0, 'ETB')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_mezgeb_subscription() from public, anon, authenticated, service_role;
grant execute on function public.handle_new_mezgeb_subscription() to postgres;

drop trigger if exists on_auth_user_created_mezgeb_subscription on auth.users;
create trigger on_auth_user_created_mezgeb_subscription
after insert on auth.users
for each row execute procedure public.handle_new_mezgeb_subscription();

insert into public.mezgeb_subscriptions (
  user_id, plan_code, billing_cycle, status, amount_etb, currency
)
select id, 'free', 'monthly', 'active', 0, 'ETB'
from auth.users
on conflict (user_id) do nothing;
