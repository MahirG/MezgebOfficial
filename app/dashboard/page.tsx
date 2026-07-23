import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BusinessOnboardingForm } from '@/components/business-onboarding-form';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect('/auth/sign-in');

  const user = userData.user;
  const [{ data: profile }, { data: businesses, error: businessesError }] = await Promise.all([
    supabase
      .from('mezgeb_profiles')
      .select('full_name, preferred_language, last_business_id')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('mezgeb_businesses')
      .select('id, name, city, tin, vat_registered, created_at')
      .order('created_at', { ascending: true })
  ]);

  const displayName = profile?.full_name || String(user.user_metadata?.full_name ?? '') || user.email?.split('@')[0] || 'Business owner';
  const businessList = businesses ?? [];

  return (
    <main id="main-content" className="accountDashboard">
      <div className="container">
        <header className="dashboardHero">
          <div>
            <p className="overline">Secure Mezgeb account</p>
            <h1>Welcome, {displayName}.</h1>
            <p>Your account is authenticated by Supabase. Every Mezgeb business and financial record is isolated through database Row Level Security.</p>
          </div>
          <div className="dashboardAccountActions">
            <span className="accountIdentity">{user.email}</span>
            <Link className="button primary" href="/app">Open app</Link>
            <form action="/auth/sign-out" method="post">
              <button className="button" type="submit">Sign out</button>
            </form>
          </div>
        </header>

        {businessesError ? (
          <section className="dashboardEmpty">
            <p className="overline">Connection error</p>
            <h2>Your businesses could not be loaded.</h2>
            <p>{businessesError.message}</p>
          </section>
        ) : businessList.length === 0 ? (
          <section className="dashboardCard">
            <header className="dashboardCardHeader">
              <div>
                <p className="overline">First-time setup</p>
                <h2>Create your first business.</h2>
                <p>This becomes the protected workspace for your ledger, customers, Dube, VAT receipts, inventory and reports.</p>
              </div>
              <span className="workspaceStatus">Authentication active</span>
            </header>
            <BusinessOnboardingForm />
          </section>
        ) : (
          <section>
            <header className="dashboardCardHeader">
              <div>
                <p className="overline">Your businesses</p>
                <h2>Choose a workspace.</h2>
                <p>These records are loaded from the connected Mezgeb Supabase project and are visible only to your authenticated account.</p>
              </div>
              <span className="workspaceStatus">Securely connected</span>
            </header>
            <div className="businessWorkspaceGrid">
              {businessList.map((business) => (
                <article className="businessWorkspaceCard" key={business.id}>
                  <small>{business.vat_registered ? 'VAT-registered business' : 'Standard business'}</small>
                  <strong>{business.name}</strong>
                  <span>{business.city || 'Location not added'}{business.tin ? ` · TIN ${business.tin}` : ''}</span>
                  <Link className="button primary" href={`/app?business=${business.id}`}>Open workspace</Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
