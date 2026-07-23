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

export function PricingSection({ plans, subscription }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(subscription?.billingCycle ?? 'monthly');
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const proPlan = useMemo(() => plans.find((plan) => plan.code === 'pro'), [plans]);
  const annualSaving = proPlan
    ? Math.max(0, proPlan.monthlyPriceEtb * 12 - proPlan.annualPriceEtb)
    : 0;

  async function selectPlan(planCode: string) {
    if (busyPlan) return;
    setBusyPlan(planCode);
    setMessage('Saving your plan securely…');

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
          <p className="overline">Simple pricing</p>
          <h2>Start free. Upgrade when the business grows.</h2>
          <p>Plans and ETB prices are loaded from Mezgeb’s secure billing catalogue. A verified payment provider will be connected before paid renewals are collected.</p>
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
              {annualSaving > 0 ? <span className={styles.saving}>Save ETB {formatEtb(annualSaving)}</span> : null}
            </button>
          </div>
        </header>

        <div className={styles.grid}>
          {plans.map((plan) => {
            const amount = billingCycle === 'annual' ? plan.annualPriceEtb : plan.monthlyPriceEtb;
            const current = subscription?.planCode === plan.code;
            const trialActive = current && subscription?.status === 'trialing';
            const buttonLabel = current
              ? trialActive
                ? 'Trial active'
                : 'Current plan'
              : plan.code === 'pro' && plan.trialDays > 0
                ? `Start ${plan.trialDays}-day trial`
                : `Choose ${plan.name}`;

            return (
              <article className={`${styles.card} ${plan.featured ? styles.featured : ''}`} key={plan.code}>
                <div className={styles.planTop}>
                  <small>{plan.name}</small>
                  {current ? <span className={styles.badge}>Current plan</span> : null}
                </div>
                <h3 className={styles.price}>
                  ETB {formatEtb(amount)} <span>/ {billingCycle === 'annual' ? 'year' : 'month'}</span>
                </h3>
                <p className={styles.description}>{plan.description}</p>
                {plan.trialDays > 0 ? <span className={styles.trial}>{plan.trialDays}-day Pro trial</span> : null}
                <ul className={styles.features}>
                  {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
                </ul>
                <button
                  className={`button ${plan.featured ? 'white' : 'secondaryDark'} ${styles.action}`}
                  type="button"
                  disabled={current || busyPlan !== null}
                  onClick={() => selectPlan(plan.code)}
                >
                  {busyPlan === plan.code ? 'Please wait…' : buttonLabel}
                </button>
              </article>
            );
          })}
        </div>

        <p className={styles.status} role="status" aria-live="polite">{message}</p>
        <p className={styles.billingNote}><strong>No payment is charged by this screen.</strong> Pro begins with one database-enforced trial. Paid activation will require a verified provider webhook and merchant credentials.</p>
      </div>
    </section>
  );
}
