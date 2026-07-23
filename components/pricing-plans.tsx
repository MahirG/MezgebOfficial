'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type BillingCycle = 'monthly' | 'annual';
type Plan = {
  code: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  trialDays: number;
  features: string[];
};

type Subscription = {
  plan_code: string;
  billing_cycle: BillingCycle;
  status: string;
};

const FALLBACK_PLANS: Plan[] = [
  {
    code: 'free',
    name: 'Free',
    description: 'For starting a digital daily ledger.',
    monthlyPrice: 0,
    annualPrice: 0,
    trialDays: 0,
    features: ['Sales and expense ledger', 'Dube credit book', 'Basic reports', 'Up to 30 VAT receipts']
  },
  {
    code: 'pro',
    name: 'Mezgeb Pro',
    description: 'For growing businesses needing more control.',
    monthlyPrice: 299,
    annualPrice: 2990,
    trialDays: 7,
    features: ['Unlimited VAT receipts', 'Advanced reports', 'Cross-device sync', 'Up to 10 businesses', 'Priority support']
  }
];

function normalizeFeatures(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function subscriptionMessage(plan: Plan, subscription: Subscription) {
  if (plan.code === 'free') return 'Free plan activated on your Mezgeb account.';
  if (subscription.status === 'trialing') {
    return `${plan.trialDays}-day Mezgeb Pro trial activated. No payment has been charged.`;
  }
  return 'Mezgeb Pro selected. No payment has been charged; the subscription is pending a verified payment connection.';
}

export function PricingPlans({
  standalone = false,
  requestedPlan = null,
  initialCycle = 'monthly'
}: {
  standalone?: boolean;
  requestedPlan?: string | null;
  initialCycle?: BillingCycle;
}) {
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const autoApplied = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const [{ data: planRows }, { data: authData }] = await Promise.all([
        supabase
          .from('mezgeb_plans')
          .select('code,name,description,monthly_price_etb,annual_price_etb,trial_days,features,sort_order')
          .eq('is_active', true)
          .order('sort_order'),
        supabase.auth.getUser()
      ]);

      if (planRows?.length) {
        setPlans(planRows.map((row) => ({
          code: row.code,
          name: row.name,
          description: row.description,
          monthlyPrice: Number(row.monthly_price_etb),
          annualPrice: Number(row.annual_price_etb),
          trialDays: Number(row.trial_days ?? 0),
          features: normalizeFeatures(row.features)
        })));
      }

      const user = authData.user;
      if (!user) return;
      setUserId(user.id);
      const { data: current } = await supabase
        .from('mezgeb_subscriptions')
        .select('plan_code,billing_cycle,status')
        .eq('user_id', user.id)
        .maybeSingle();
      if (current) setSubscription(current as Subscription);
    })();
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.code === requestedPlan) ?? null,
    [plans, requestedPlan]
  );

  const persistPlan = useCallback(async (planCode: string, cycle: BillingCycle, ownerId: string) => {
    const plan = plans.find((item) => item.code === planCode);
    if (!plan) throw new Error('This plan is not available.');

    const supabase = createClient();
    const { data: updated, error } = await supabase
      .from('mezgeb_subscriptions')
      .update({ plan_code: plan.code, billing_cycle: cycle })
      .eq('user_id', ownerId)
      .select('plan_code,billing_cycle,status')
      .single();

    if (error) throw error;
    const safeSubscription = updated as Subscription;
    setSubscription(safeSubscription);
    setStatus(subscriptionMessage(plan, safeSubscription));
  }, [plans]);

  useEffect(() => {
    if (!requestedPlan || !userId || autoApplied.current || !plans.some((plan) => plan.code === requestedPlan)) return;
    autoApplied.current = true;
    setBusyPlan(requestedPlan);
    void persistPlan(requestedPlan, billingCycle, userId)
      .catch((error) => setStatus(error instanceof Error ? error.message : 'The selected plan could not be saved.'))
      .finally(() => setBusyPlan(null));
  }, [billingCycle, persistPlan, plans, requestedPlan, userId]);

  async function choosePlan(plan: Plan) {
    setBusyPlan(plan.code);
    setStatus('Saving your plan securely…');
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        const next = `/pricing?plan=${encodeURIComponent(plan.code)}&cycle=${billingCycle}`;
        window.location.assign(`/auth/sign-up?next=${encodeURIComponent(next)}`);
        return;
      }
      await persistPlan(plan.code, billingCycle, data.user.id);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The selected plan could not be saved.');
    } finally {
      setBusyPlan(null);
    }
  }

  const content = (
    <div className="container">
      <header className="sectionHeader">
        <p className="overline">Supabase-backed pricing</p>
        <h2>Start free. Upgrade when the business grows.</h2>
        <p>Plan details are loaded from Mezgeb’s database. Supabase—not the browser—calculates the ETB price and controls trial and payment status.</p>
      </header>

      <div className="billingToggle" role="group" aria-label="Billing cycle">
        <button type="button" className={billingCycle === 'monthly' ? 'active' : ''} onClick={() => setBillingCycle('monthly')}>Monthly</button>
        <button type="button" className={billingCycle === 'annual' ? 'active' : ''} onClick={() => setBillingCycle('annual')}>Annual <span>Save ETB 598</span></button>
      </div>

      {selectedPlan ? <div className="pricingReturnNotice">Continuing your selected <strong>{selectedPlan.name}</strong> plan after authentication.</div> : null}

      <div className="pricing">
        {plans.map((plan) => {
          const amount = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
          const isPro = plan.code === 'pro';
          const isCurrent = subscription?.plan_code === plan.code;
          return (
            <article className={isPro ? 'featured' : ''} key={plan.code}>
              <small>{plan.name}</small>
              <h3>ETB {amount.toLocaleString()} <span>/ {billingCycle === 'annual' ? 'year' : 'month'}</span></h3>
              <p>{plan.description}</p>
              {plan.trialDays > 0 ? <div className="trialBadge">{plan.trialDays}-day trial</div> : null}
              {isCurrent ? <div className="currentPlanBadge">Current · {subscription.status.replace('_', ' ')}</div> : null}
              <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              <button
                className={`button ${isPro ? 'white' : 'secondaryDark'}`}
                type="button"
                disabled={busyPlan !== null || isCurrent}
                onClick={() => void choosePlan(plan)}
              >
                {busyPlan === plan.code ? 'Saving…' : isCurrent ? 'Current plan' : plan.code === 'free' ? 'Choose Free' : 'Start Pro trial'}
              </button>
            </article>
          );
        })}
      </div>
      <p className="pricingStatus" role="status" aria-live="polite">{status}</p>
      <p className="pricingFootnote">Starting Pro does not charge a card or mobile wallet. Any paid activation must be confirmed by a verified provider through a secure server-side process.</p>
      {standalone ? <Link className="textButton" href="/">← Return to the website</Link> : null}
    </div>
  );

  return standalone
    ? <main id="main-content" className="pageShell pricingPage">{content}</main>
    : <section className="section" id="pricing">{content}</section>;
}
