const fallbackUrl = 'https://vcyzgoiconxjmntoreto.supabase.co';
const fallbackPublishableKey = 'sb_publishable_uaJUWNU-9Kvvao5461NFwA_WMkSLkTq';

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackUrl;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || fallbackPublishableKey;

  return { url, publishableKey };
}

export function isSupabaseConfigured() {
  const { url, publishableKey } = getSupabaseConfig();
  return Boolean(url && publishableKey);
}
