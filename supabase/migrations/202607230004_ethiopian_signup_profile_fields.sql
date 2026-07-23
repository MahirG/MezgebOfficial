alter table public.mezgeb_profiles
  add column if not exists region text,
  add column if not exists city_woreda text,
  add column if not exists account_role text not null default 'owner',
  add column if not exists id_type text,
  add column if not exists id_last4 text,
  add column if not exists identity_status text not null default 'unverified',
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists identity_consent_at timestamptz;

alter table public.mezgeb_profiles drop constraint if exists mezgeb_profiles_preferred_language_check;
alter table public.mezgeb_profiles add constraint mezgeb_profiles_preferred_language_check
  check (preferred_language in ('en','am','om','ti'));

alter table public.mezgeb_profiles drop constraint if exists mezgeb_profiles_account_role_check;
alter table public.mezgeb_profiles add constraint mezgeb_profiles_account_role_check
  check (account_role in ('owner','manager','accountant','employee'));

alter table public.mezgeb_profiles drop constraint if exists mezgeb_profiles_id_type_check;
alter table public.mezgeb_profiles add constraint mezgeb_profiles_id_type_check
  check (id_type is null or id_type in ('fayda','passport','origin_id','kebele','driver_license','other'));

alter table public.mezgeb_profiles drop constraint if exists mezgeb_profiles_id_last4_check;
alter table public.mezgeb_profiles add constraint mezgeb_profiles_id_last4_check
  check (id_last4 is null or char_length(id_last4) = 4);

alter table public.mezgeb_profiles drop constraint if exists mezgeb_profiles_identity_status_check;
alter table public.mezgeb_profiles add constraint mezgeb_profiles_identity_status_check
  check (identity_status in ('unverified','pending','verified','rejected'));

create or replace function public.handle_new_mezgeb_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.mezgeb_profiles (
    id, full_name, phone, preferred_language, region, city_woreda,
    account_role, id_type, id_last4, identity_status,
    terms_accepted_at, identity_consent_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    case when new.raw_user_meta_data->>'preferred_language' in ('en','am','om','ti')
      then new.raw_user_meta_data->>'preferred_language' else 'en' end,
    nullif(new.raw_user_meta_data->>'region', ''),
    nullif(new.raw_user_meta_data->>'city_woreda', ''),
    case when new.raw_user_meta_data->>'account_role' in ('owner','manager','accountant','employee')
      then new.raw_user_meta_data->>'account_role' else 'owner' end,
    case when new.raw_user_meta_data->>'id_type' in ('fayda','passport','origin_id','kebele','driver_license','other')
      then new.raw_user_meta_data->>'id_type' else null end,
    case when char_length(coalesce(new.raw_user_meta_data->>'id_last4','')) = 4
      then new.raw_user_meta_data->>'id_last4' else null end,
    'unverified',
    case when new.raw_user_meta_data->>'terms_accepted' = 'true' then now() else null end,
    case when new.raw_user_meta_data->>'identity_consent' = 'true' then now() else null end
  )
  on conflict (id) do update
    set full_name = case when public.mezgeb_profiles.full_name = '' then excluded.full_name else public.mezgeb_profiles.full_name end,
        phone = coalesce(public.mezgeb_profiles.phone, excluded.phone),
        preferred_language = coalesce(public.mezgeb_profiles.preferred_language, excluded.preferred_language),
        region = coalesce(public.mezgeb_profiles.region, excluded.region),
        city_woreda = coalesce(public.mezgeb_profiles.city_woreda, excluded.city_woreda),
        account_role = coalesce(public.mezgeb_profiles.account_role, excluded.account_role),
        id_type = coalesce(public.mezgeb_profiles.id_type, excluded.id_type),
        id_last4 = coalesce(public.mezgeb_profiles.id_last4, excluded.id_last4),
        terms_accepted_at = coalesce(public.mezgeb_profiles.terms_accepted_at, excluded.terms_accepted_at),
        identity_consent_at = coalesce(public.mezgeb_profiles.identity_consent_at, excluded.identity_consent_at),
        updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_mezgeb_user() from public, anon, authenticated, service_role;
grant execute on function public.handle_new_mezgeb_user() to postgres;

comment on column public.mezgeb_profiles.id_last4 is
  'Only the final four characters of the identity document are retained during registration. Full document numbers are not stored.';
comment on column public.mezgeb_profiles.identity_status is
  'Identity verification state. Registration creates an unverified record until a formal verification provider is integrated.';
