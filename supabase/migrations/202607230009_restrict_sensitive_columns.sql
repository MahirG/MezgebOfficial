revoke all on table public.mezgeb_profiles from anon;
revoke update on table public.mezgeb_profiles from authenticated;
grant select on table public.mezgeb_profiles to authenticated;
grant update (full_name, phone, preferred_language, region, city_woreda, account_role, last_business_id)
  on public.mezgeb_profiles to authenticated;

revoke all on table public.mezgeb_subscriptions from anon;
revoke insert, update, delete on table public.mezgeb_subscriptions from authenticated;
grant select on table public.mezgeb_subscriptions to authenticated;
grant update (business_id, plan_code, billing_cycle)
  on public.mezgeb_subscriptions to authenticated;

comment on column public.mezgeb_profiles.identity_status is
  'Server-managed verification state. Authenticated users cannot update this column directly.';
comment on column public.mezgeb_subscriptions.status is
  'Server-managed billing state. Authenticated users may select plan and billing cycle but cannot set payment status.';
