import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';

export default async function Dashboard(){
  if (!isSupabaseConfigured()) return <main id="main-content" className="pageShell container"><p className="overline">Production dashboard</p><h1>Backend configuration required.</h1><p className="pageLead">Create a dedicated Mezgeb Supabase project, apply the migration, and add the environment variables. The interactive demo remains available without a backend.</p><Link className="button primary" href="/demo">Open demo</Link></main>;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect('/auth/sign-in');
  return <main id="main-content" className="pageShell container"><p className="overline">Production dashboard</p><h1>Your Mezgeb workspace.</h1><p className="pageLead">Authentication is active. Apply the included database migration to enable businesses, transactions, customers, receipts and reports.</p></main>;
}
