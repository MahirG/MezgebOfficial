'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './payment-return.module.css';

type PaymentState = 'checking' | 'paid' | 'pending' | 'failed' | 'invalid';

export function PaymentReturnClient({ txRef, initialStatus }: { txRef: string; initialStatus: string }) {
  const [state, setState] = useState<PaymentState>(txRef ? 'checking' : 'invalid');
  const [message, setMessage] = useState(initialStatus === 'pending' ? 'The provider is still confirming this payment.' : 'Confirming the payment with Chapa…');

  useEffect(() => {
    if (!txRef) return;
    let cancelled = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function verify() {
      attempt += 1;
      try {
        const response = await fetch(`/api/payments/verify?tx_ref=${encodeURIComponent(txRef)}`, { cache: 'no-store' });
        const result = await response.json() as { status?: string; message?: string; error?: string };
        if (cancelled) return;

        if (response.status === 401) {
          window.location.assign(`/auth/sign-in?next=${encodeURIComponent(`/payment/return?tx_ref=${txRef}`)}`);
          return;
        }

        if (result.status === 'paid') {
          setState('paid');
          setMessage('Payment verified. Your Mezgeb plan is active.');
          return;
        }

        if (result.status === 'failed') {
          setState('failed');
          setMessage(result.message || result.error || 'The payment was not completed.');
          return;
        }

        if (attempt < 5) {
          setState('pending');
          setMessage(result.message || 'Payment received. Waiting for final provider confirmation…');
          timer = setTimeout(verify, 2200);
          return;
        }

        setState('pending');
        setMessage('Confirmation is taking longer than usual. Your account will update automatically after the verified webhook arrives.');
      } catch {
        if (cancelled) return;
        setState('pending');
        setMessage('We could not confirm the payment yet. No second charge will be created by refreshing this page.');
      }
    }

    void verify();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [txRef]);

  return (
    <main className={styles.shell}>
      <section className={styles.card} aria-live="polite">
        <div className={`${styles.statusMark} ${styles[state]}`} aria-hidden="true">
          {state === 'paid' ? '✓' : state === 'failed' || state === 'invalid' ? '!' : '↻'}
        </div>
        <p className={styles.eyebrow}>Mezgeb secure checkout</p>
        <h1>
          {state === 'paid'
            ? 'Payment confirmed'
            : state === 'failed'
              ? 'Payment not completed'
              : state === 'invalid'
                ? 'Invalid payment reference'
                : 'Confirming your payment'}
        </h1>
        <p className={styles.message}>{message}</p>
        {txRef ? <code className={styles.reference}>{txRef}</code> : null}
        <div className={styles.actions}>
          <Link className="button primary" href="/dashboard">Open dashboard</Link>
          <Link className={styles.secondary} href="/#pricing">Back to pricing</Link>
        </div>
        <div className={styles.safetyNote}>
          <strong>Verified activation only</strong>
          <span>Mezgeb activates a paid plan only after the provider reference, status, amount and ETB currency match the original server-side payment intent.</span>
        </div>
      </section>
    </main>
  );
}
