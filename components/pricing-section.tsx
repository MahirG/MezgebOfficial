'use client';

import { useMemo, useState } from 'react';
import type { BillingCycle, PricingPlan, SubscriptionSummary } from '@/lib/pricing';
import styles from './pricing-section.module.css';

type PricingSectionProps = {
  plans: PricingPlan[];
  subscription: SubscriptionSummary | null;
};

function formatEtb(amount: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
}

function annualSaving(plan: PricingPlan) {
  if (plan.customPricing) return 0;
  return Math.max(0, plan.monthlyPriceEtb * 12 - plan.annualPriceEtb);
}

export function PricingSection({ plans, subscription }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(subscription?.billingCycle ?? 'monthly');
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const maximumSaving = useMemo(
    () => plans.reduce((largest, plan) => Math.max(largest, annualSaving(plan)), 0),
    [plans]
  );

  async function selectPlan(planCode: string) {
    if (busyPlan) return;
    setBusyPlan(planCode);
    setMessage('Saving your Mezgeb plan securely…');

    try {
      const response = await fetch('/api/subscriptions/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCode, billingCycle })
      });

      if (response.status === 401) {
        window.location.assign('/auth/sign-up?next=%2Fdashboard');
        return;
      }

      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'The plan could not be selected.');

      window.location.assign('/dashboard?plan=updated');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The plan could not be selected.');
      setBusyPlan(null);
    }
  }

  return (
    <section className={styles.section} id="pricing">
      <div className="container">
        <header className={styles.header}>
          <p className="overline">Transparent ETB pricing</p>
          <h2>Choose the operating level that fits the business.</h2>
          <p>Starter, Growth and Business prices are stored in Mezgeb’s protected Supabase catalogue. Enterprise is scoped around the organization. Paid activation will begin only through a verified payment provider.</p>
          <div className={styles.billingSwitch} aria-label="Billing interval">
            <button
              className={billingCycle === 'monthly' ? styles.active : ''}
              type="button"
              aria-pressed={billingCycle === 'monthly'}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={billingCycle === 'annual' ? styles.active : ''}
              type="button"
              aria-pressed={billingCycle === 'annual'}
              onClick={() => setBillingCycle('annual')}
            >
              Yearly
              {maximumSaving > 0 ? <span className={styles.saving}>Save up to ETB {formatEtb(maximumSaving)}</span> : null}
            </button>
          </div>
        </header>

        <div className={styles.grid}>
          {plans.map((plan) => {
            const amount = billingCycle === 'annual' ? plan.annualPriceEtb : plan.monthlyPriceEtb;
            const saving = annualSaving(plan);
            const current = subscription?.planCode === plan.code;
            const trialActive = current && subscription?.status === 'trialing';
            const buttonLabel = current
              ? trialActive
                ? 'Trial active'
                : 'Current plan'
              : plan.trialDays > 0
                ? `Start ${plan.trialDays}-day trial`
                : plan.code === 'business'
                  ? 'Request Business setup'
                  : `Choose ${plan.name}`;

            return (
              <article className={`${styles.card} ${plan.featured ? styles.featured : ''}`} key={plan.code}>
                <div className={styles.planTop}>
                  <div>
                    <small>{plan.name}</small>
                    {plan.featured ? <span className={styles.popular}>Most popular</span> : null}
                  </div>
                  {current ? <span className={styles.badge}>Current plan</span> : null}
                </div>

                <p className={styles.audience}>{plan.audience}</p>
                <h3 className={styles.price}>
                  {plan.customPricing ? 'Custom' : <>ETB {formatEtb(amount)}</>}
                  {!plan.customPricing ? <span>/ {billingCycle === 'annual' ? 'year' : 'month'}</span> : null}
                </h3>
                {billingCycle === 'annual' && saving > 0 ? <span className={styles.annualValue}>Save ETB {formatEtb(saving)} each year</span> : null}
                <p className={styles.description}>{plan.description}</p>
                <span className={styles.capacity}>{plan.capacity}</span>
                {plan.trialDays > 0 ? <span className={styles.trial}>{plan.trialDays}-day trial · no charge from this screen</span> : null}

                <ul className={styles.features}>
                  {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>

                {plan.customPricing ? (
                  <a className={`button secondaryDark ${styles.action}`} href="mailto:info@hisabtech.com?subject=Mezgeb%20Enterprise%20pricing">Talk to enterprise sales</a>
                ) : (
                  <button
                    className={`button ${plan.featured ? 'white' : 'secondaryDark'} ${styles.action}`}
                    type="button"
                    disabled={current || busyPlan !== null}
                    onClick={() => selectPlan(plan.code)}
                  >
                    {busyPlan === plan.code ? 'Please wait…' : buttonLabel}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <p className={styles.status} role="status" aria-live="polite">{message}</p>
        <div className={styles.billingNote}>
          <strong>Commercially clear and technically controlled.</strong>
          <span>Subscription amounts are calculated by the database. A plan selection does not claim payment success; merchant credentials and a verified webhook are required before paid activation.</span>
        </div>
      </div>
    </section>
  );
}
