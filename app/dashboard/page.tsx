import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BusinessOnboardingForm } from '@/components/business-onboarding-form';
import { createClient } from '@/lib/supabase/server';
import styles from './dashboard.module.css';

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect('/auth/sign-in');

  const user = userData.user;
  const [
    { data: profile },
    { data: businesses, error: businessesError },
    { data: subscription }
  ] = await Promise.all([
    supabase
      .from('mezgeb_profiles')
      .select('full_name, preferred_language, last_business_id')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('mezgeb_businesses')
      .select('id, name, city, tin, vat_registered, created_at')
      .order('created_at', { ascending: true }),
    supabase
      .from('mezgeb_subscriptions')
      .select('plan_code, billing_cycle, status, amount_etb, currency, trial_ends_at, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle()
  ]);

  const displayName = profile?.full_name || String(user.user_metadata?.full_name ?? '') || user.email?.split('@')[0] || 'Business owner';
  const businessList = businesses ?? [];
  const planName = subscription?.plan_code === 'pro' ? 'Mezgeb Pro' : 'Free';
  const subscriptionStatus = subscription?.status ?? 'available';
  const billingCycle = subscription?.billing_cycle === 'annual' ? 'yearly' : 'monthly';
  const trialEnd = formatDate(subscription?.trial_ends_at ?? null);
  const periodEnd = formatDate(subscription?.current_period_end ?? null);
  const planDescription = subscription
    ? subscription.status === 'trialing' && trialEnd
      ? `${billingCycle} plan · Trial ends ${trialEnd}`
      : subscription.status === 'pending_payment'
        ? `${billingCycle} selection saved · Payment provider connection required`
        : periodEnd
          ? `${billingCycle} plan · Current period ends ${periodEnd}`
          : `${billingCycle} plan · ETB ${Number(subscription.amount_etb ?? 0).toLocaleString('en-US')}`
    : 'No plan has been selected yet. Free access remains available.';

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

        <section className={styles.subscriptionCard} aria-label="Mezgeb subscription">
          <div className={styles.copy}>
            <small>Current plan</small>
            <h2>{planName}</h2>
            <p>{planDescription}</p>
          </div>
          <div className={styles.meta}>
            <span className={`${styles.badge} ${subscriptionStatus === 'trialing' ? styles.trial : ''}`}>{subscriptionStatus.replace('_', ' ')}</span>
            <Link className={`button white ${styles.action}`} href="/#pricing">Manage plan</Link>
          </div>
        </section>

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
