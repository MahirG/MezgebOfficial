'use client';

import { useEffect, useMemo, useState } from 'react';
import { paymentMethods, type PaymentMethodCode } from '@/lib/payment-methods';
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

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `mezgeb-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function PricingSection({ plans, subscription }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(subscription?.billingCycle ?? 'monthly');
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodCode>('telebirr');
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');

  const maximumSaving = useMemo(
    () => plans.reduce((largest, plan) => Math.max(largest, annualSaving(plan)), 0),
    [plans]
  );

  useEffect(() => {
    if (!selectedPlan) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !checkoutBusy) setSelectedPlan(null);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedPlan, checkoutBusy]);

  function amountFor(plan: PricingPlan) {
    return billingCycle === 'annual' ? plan.annualPriceEtb : plan.monthlyPriceEtb;
  }

  function openPlan(plan: PricingPlan) {
    setSelectedPlan(plan);
    setSelectedMethod('telebirr');
    setCheckoutMessage('');
  }

  function closeCheckout() {
    if (checkoutBusy) return;
    setSelectedPlan(null);
    setCheckoutMessage('');
  }

  async function selectPlan(planCode: string) {
    if (busyPlan || checkoutBusy) return;
    setBusyPlan(planCode);
    setCheckoutMessage('Starting your Mezgeb trial securely…');
    setMessage('Saving your Mezgeb plan securely…');

    try {
      const response = await fetch('/api/subscriptions/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planCode, billingCycle })
      });

      if (response.status === 401) {
        window.location.assign(`/auth/sign-up?next=${encodeURIComponent('/dashboard')}`);
        return;
      }

      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'The plan could not be selected.');

      window.location.assign('/dashboard?plan=updated');
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'The plan could not be selected.';
      setMessage(reason);
      setCheckoutMessage(reason);
      setBusyPlan(null);
    }
  }

  async function startSecurePayment() {
    if (!selectedPlan || checkoutBusy) return;
    setCheckoutBusy(true);
    setCheckoutMessage('Creating a protected ETB payment intent…');

    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: selectedPlan.code,
          billingCycle,
          paymentMethod: selectedMethod,
          idempotencyKey: createIdempotencyKey()
        })
      });

      if (response.status === 401) {
        const next = `/#pricing?plan=${encodeURIComponent(selectedPlan.code)}&pay=1`;
        window.location.assign(`/auth/sign-up?next=${encodeURIComponent(next)}`);
        return;
      }

      const result = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !result.checkoutUrl) {
        throw new Error(result.error || 'The secure checkout could not be opened.');
      }

      setCheckoutMessage('Redirecting to Chapa secure checkout…');
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setCheckoutMessage(error instanceof Error ? error.message : 'The secure checkout could not be opened.');
      setCheckoutBusy(false);
    }
  }

  const selectedAmount = selectedPlan ? amountFor(selectedPlan) : 0;

  return (
    <section className={styles.section} id="pricing">
      <div className="container">
        <header className={styles.header}>
          <p className="overline">Transparent ETB pricing</p>
          <h2>Choose the operating level that fits the business.</h2>
          <p>Review the plan, select a familiar Ethiopian payment method and continue through a server-verified checkout. A paid plan activates only after the provider status, amount, currency and reference match Mezgeb’s protected payment intent.</p>
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

          <div className={styles.paymentRail} aria-label="Ethiopian payment methods available through secure checkout">
            <span className={styles.paymentRailLabel}><b>Secure ETB checkout</b><small>Powered by Chapa</small></span>
            <div className={styles.paymentRailMethods}>
              {paymentMethods.map((method) => (
                <span className={styles.paymentRailMethod} key={method.code} title={method.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={method.source} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                  <strong>{method.shortLabel}</strong>
                </span>
              ))}
            </div>
          </div>
        </header>

        <div className={styles.grid}>
          {plans.map((plan) => {
            const amount = amountFor(plan);
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
                  ? `Pay ETB ${formatEtb(amount)}`
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
                {plan.trialDays > 0 ? <span className={styles.trial}>{plan.trialDays}-day trial · no payment required</span> : null}

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
                    onClick={() => openPlan(plan)}
                  >
                    {busyPlan === plan.code ? 'Please wait…' : buttonLabel}
                  </button>
                )}
                {!plan.customPricing && !current ? <span className={styles.secureHint}>Trial or secure ETB payment available</span> : null}
              </article>
            );
          })}
        </div>

        <p className={styles.status} role="status" aria-live="polite">{message}</p>
        <div className={styles.billingNote}>
          <strong>Payment activation is server controlled.</strong>
          <span>Mezgeb creates an idempotent payment intent, redirects through Chapa, verifies the transaction again on the server and activates the subscription atomically. A browser redirect alone never marks a plan as paid.</span>
        </div>
      </div>

      {selectedPlan ? (
        <div className={styles.checkoutBackdrop} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeCheckout();
        }}>
          <section
            className={styles.checkoutDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mezgeb-checkout-title"
          >
            <button className={styles.closeButton} type="button" aria-label="Close payment options" onClick={closeCheckout}>×</button>

            <div className={styles.checkoutIntro}>
              <p>Mezgeb secure checkout</p>
              <h3 id="mezgeb-checkout-title">{selectedPlan.name} · ETB {formatEtb(selectedAmount)}</h3>
              <span>{billingCycle === 'annual' ? 'Annual billing' : 'Monthly billing'} · ETB currency</span>
            </div>

            <div className={styles.orderSummary}>
              <span><small>Plan</small><strong>{selectedPlan.name}</strong></span>
              <span><small>Billing</small><strong>{billingCycle === 'annual' ? 'Yearly' : 'Monthly'}</strong></span>
              <span><small>Total</small><strong>ETB {formatEtb(selectedAmount)}</strong></span>
            </div>

            <fieldset className={styles.paymentChooser}>
              <legend>Choose your preferred payment method</legend>
              <div>
                {paymentMethods.map((method) => (
                  <button
                    className={selectedMethod === method.code ? styles.selectedPayment : ''}
                    type="button"
                    aria-pressed={selectedMethod === method.code}
                    data-payment-method={method.code}
                    key={method.code}
                    onClick={() => setSelectedMethod(method.code)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={method.source} alt="" loading="eager" decoding="async" referrerPolicy="no-referrer" />
                    <span><strong>{method.name}</strong><small>{method.description}</small></span>
                    <i aria-hidden="true">{selectedMethod === method.code ? '✓' : ''}</i>
                  </button>
                ))}
              </div>
            </fieldset>

            <p className={styles.providerNote}>Your preferred method is recorded with the payment intent. Final channel availability is confirmed inside the merchant’s live Chapa checkout configuration.</p>

            <div className={styles.checkoutActions}>
              {selectedPlan.trialDays > 0 ? (
                <button
                  className={`button secondaryDark ${styles.trialAction}`}
                  type="button"
                  disabled={checkoutBusy || busyPlan !== null}
                  onClick={() => selectPlan(selectedPlan.code)}
                >
                  Start {selectedPlan.trialDays}-day trial
                  <small>No payment now</small>
                </button>
              ) : null}
              <button
                className={`button primary ${styles.payAction}`}
                type="button"
                disabled={checkoutBusy || busyPlan !== null}
                onClick={startSecurePayment}
              >
                {checkoutBusy ? 'Opening secure checkout…' : `Pay ETB ${formatEtb(selectedAmount)} securely`}
              </button>
            </div>

            <p className={styles.checkoutStatus} role="status" aria-live="polite">{checkoutMessage}</p>
            <div className={styles.checkoutSafety}>
              <span>🔒 Server-calculated amount</span>
              <span>↻ Duplicate-charge protection</span>
              <span>✓ Verified webhook activation</span>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
