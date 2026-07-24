-- The BEFORE UPDATE trigger always replaces updated_at with now(), so this narrow
-- column grant supports the RLS-invoker onboarding transaction without allowing
-- clients to persist an arbitrary timestamp.
grant update (updated_at) on public.mezgeb_profiles to authenticated;
