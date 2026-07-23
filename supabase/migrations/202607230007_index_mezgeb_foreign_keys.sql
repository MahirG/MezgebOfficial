create index if not exists mezgeb_audit_logs_user_idx
  on public.mezgeb_audit_logs(user_id) where user_id is not null;
create index if not exists mezgeb_deletion_requests_user_idx
  on public.mezgeb_deletion_requests(user_id);
create index if not exists mezgeb_profiles_last_business_idx
  on public.mezgeb_profiles(last_business_id) where last_business_id is not null;
create index if not exists mezgeb_receipts_created_by_idx
  on public.mezgeb_receipts(created_by);
create index if not exists mezgeb_receipts_customer_idx
  on public.mezgeb_receipts(customer_id) where customer_id is not null;
create index if not exists mezgeb_receipts_transaction_idx
  on public.mezgeb_receipts(transaction_id) where transaction_id is not null;
create index if not exists mezgeb_transactions_created_by_idx
  on public.mezgeb_transactions(created_by);
