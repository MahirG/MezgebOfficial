'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { paymentMethods } from '@/lib/payment-methods';
import styles from './home-hero.module.css';

const trustedPaymentCodes = new Set(['telebirr', 'mpesa', 'cbe_birr', 'amole']);
const trustedPayments = paymentMethods.filter((method) => trustedPaymentCodes.has(method.code));

const demoTransactions = [
  ['Sales', '+ ETB 4,830', 'Today · Cash'],
  ['Expense', '− ETB 1,250', 'Supplier purchase'],
  ['Dube payment', '+ ETB 2,000', 'Customer repayment']
] as const;

export function HomeHero() {
  const [demoOpen, setDemoOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!demoOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setDemoOpen(false);
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [demoOpen]);

  return (
    <>
      <div className={styles.heroFrame} data-marketing-hero>
        <div className={styles.homeHero}>
          <div className={styles.copy}>
            <span className={styles.badge}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.6 20 6v5.1c0 5.1-3.1 8.8-8 10.3-4.9-1.5-8-5.2-8-10.3V6l8-3.4Z" />
                <path d="m8.7 12 2.1 2.1 4.6-4.8" />
              </svg>
              All-in-one business management
            </span>

            <h1>
              Run the
              <br />
              business.
              <span>Know every birr.</span>
            </h1>

            <p className={styles.lead}>
              Track sales, expenses, inventory, Dube, receipts and performance—all in one simple,
              secure app built for Ethiopian businesses.
            </p>

            <div className={styles.actions}>
              <Link className={styles.primaryAction} href="/auth/sign-up">
                Get Started Free
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M14 7l5 5-5 5" />
                </svg>
              </Link>
              <button className={styles.demoAction} type="button" onClick={() => setDemoOpen(true)}>
                <span className={styles.playIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="m9 7 8 5-8 5V7Z" />
                  </svg>
                </span>
                Watch Demo
              </button>
            </div>

            <div className={styles.proofLine} aria-label="Product assurances">
              <span>No card required</span>
              <i aria-hidden="true" />
              <span>14-day trial</span>
              <i aria-hidden="true" />
              <span>Cancel anytime</span>
            </div>
          </div>

          <div className={styles.visual}>
            <div className={styles.visualGlow} aria-hidden="true" />
            <div className={styles.blueRibbonOne} aria-hidden="true" />
            <div className={styles.blueRibbonTwo} aria-hidden="true" />
            <Image
              className={styles.presenter}
              src="/images/mezgeb-presenter.webp"
              alt="Ethiopian business owner presenting the Biloo Mezgeb mobile application"
              width={600}
              height={567}
              priority
              unoptimized
              sizes="(max-width: 760px) 96vw, (max-width: 1100px) 52vw, 650px"
            />
            <div className={styles.floatingBalance} aria-hidden="true">
              <span>Today&apos;s balance</span>
              <strong>ETB 125,430</strong>
              <small>↗ 4.7% this week</small>
            </div>
          </div>
        </div>

        <div className={styles.paymentPanel} aria-label="Supported payment and business channels">
          <span className={`${styles.paymentBrand} ${styles.visa}`}>VISA</span>
          <span className={`${styles.paymentBrand} ${styles.mastercard}`}>
            <i />
            <i />
            <b className={styles.srOnly}>Mastercard</b>
          </span>
          {trustedPayments.map((method) => (
            <span className={styles.paymentBrand} key={method.code}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={method.source}
                alt=""
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <strong>{method.shortLabel}</strong>
            </span>
          ))}
        </div>
      </div>

      {demoOpen ? (
        <div className={styles.demoLayer}>
          <button
            className={styles.demoBackdrop}
            type="button"
            aria-label="Close product demo"
            onClick={() => setDemoOpen(false)}
          />
          <section
            className={styles.demoDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mezgeb-demo-title"
          >
            <header className={styles.demoHeader}>
              <div>
                <span>Interactive product preview</span>
                <h2 id="mezgeb-demo-title">See the business in one clear view.</h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close product demo"
                onClick={() => setDemoOpen(false)}
              >
                ×
              </button>
            </header>

            <div className={styles.demoWorkspace}>
              <aside className={styles.demoRail} aria-label="Demo navigation">
                <b>መ</b>
                <span className={styles.demoRailActive}>⌂</span>
                <span>▤</span>
                <span>◎</span>
                <span>◫</span>
              </aside>
              <div className={styles.demoContent}>
                <div className={styles.demoTopline}>
                  <div>
                    <small>Good afternoon</small>
                    <strong>My Business</strong>
                  </div>
                  <span>MA</span>
                </div>
                <div className={styles.demoMetrics}>
                  <article>
                    <small>Today&apos;s sales</small>
                    <strong>ETB 12,450</strong>
                    <span>+8.4%</span>
                  </article>
                  <article>
                    <small>Cash on hand</small>
                    <strong>ETB 48,250</strong>
                    <span>Available now</span>
                  </article>
                  <article>
                    <small>Open Dube</small>
                    <strong>ETB 4,200</strong>
                    <span>4 customers</span>
                  </article>
                </div>
                <div className={styles.demoLedger}>
                  <div className={styles.demoLedgerTitle}>
                    <div>
                      <small>Live ledger</small>
                      <h3>Recent transactions</h3>
                    </div>
                    <Link href="/demo" onClick={() => setDemoOpen(false)}>
                      Open full demo →
                    </Link>
                  </div>
                  {demoTransactions.map(([title, amount, detail]) => (
                    <div className={styles.demoTransaction} key={title}>
                      <span aria-hidden="true">{title === 'Expense' ? '↘' : '↗'}</span>
                      <div>
                        <strong>{title}</strong>
                        <small>{detail}</small>
                      </div>
                      <b>{amount}</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <footer className={styles.demoFooter}>
              <p>Ready to replace scattered notes with one business record?</p>
              <Link href="/auth/sign-up" onClick={() => setDemoOpen(false)}>
                Start free trial
              </Link>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
