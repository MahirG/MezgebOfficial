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

const navigationHotspots = [
  { label: 'Biloo Mezgeb home', href: '/', className: styles.brandHotspot },
  { label: 'Home', href: '/', className: styles.homeHotspot },
  { label: 'Features', href: '/#features', className: styles.featuresHotspot },
  { label: 'Pricing', href: '/#pricing', className: styles.pricingHotspot },
  { label: 'Resources', href: '/help', className: styles.resourcesHotspot },
  { label: 'About Us', href: '/#ethiopia', className: styles.aboutHotspot },
  { label: 'Log in', href: '/auth/sign-in', className: styles.loginHotspot },
  { label: 'Get Started', href: '/auth/sign-up', className: styles.getStartedHotspot }
] as const;

function PaymentBrand({ type }: { type: 'visa' | 'mastercard' }) {
  if (type === 'visa') {
    return <span className={`${styles.paymentBrand} ${styles.visa}`}>VISA</span>;
  }

  return (
    <span className={`${styles.paymentBrand} ${styles.mastercard}`}>
      <i />
      <i />
      <b className={styles.srOnly}>Mastercard</b>
    </span>
  );
}

function PaymentSequence({ copy }: { copy: string }) {
  return (
    <div className={styles.marqueeGroup} aria-hidden={copy === 'duplicate'}>
      <Link className={styles.paymentLink} href="/#pricing" aria-label="View Visa payment options">
        <PaymentBrand type="visa" />
      </Link>
      <Link className={styles.paymentLink} href="/#pricing" aria-label="View Mastercard payment options">
        <PaymentBrand type="mastercard" />
      </Link>
      {trustedPayments.map((method) => (
        <Link
          className={styles.paymentLink}
          href="/#pricing"
          aria-label={`View ${method.shortLabel} payment options`}
          key={`${copy}-${method.code}`}
        >
          <span className={styles.paymentBrand}>
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
        </Link>
      ))}
    </div>
  );
}

export function HomeHero() {
  const [demoOpen, setDemoOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.dataset.exactMarketingHero = 'true';
    return () => {
      delete document.body.dataset.exactMarketingHero;
    };
  }, []);

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
        <div className={styles.heroCanvas}>
          <Image
            className={styles.heroArtwork}
            src="/images/biloo-hero-exact.webp?v=20260730"
            alt="Biloo Mezgeb business management hero with an Ethiopian business owner presenting the mobile app"
            fill
            priority
            unoptimized
            sizes="(max-width: 900px) 100vw, 1536px"
          />

          <nav className={styles.desktopHotspots} aria-label="Hero navigation">
            {navigationHotspots.map((item) => (
              <Link
                className={`${styles.hotspot} ${item.className}`}
                href={item.href}
                aria-label={item.label}
                key={item.label}
              />
            ))}
            <Link
              className={`${styles.hotspot} ${styles.freeTrialHotspot}`}
              href="/auth/sign-up"
              aria-label="Get Started Free"
            />
            <button
              className={`${styles.hotspot} ${styles.demoHotspot}`}
              type="button"
              aria-label="Watch Demo"
              onClick={() => setDemoOpen(true)}
            />
          </nav>

          <div className={styles.marqueeViewport} aria-label="Supported payment channels">
            <div className={styles.marqueeTrack}>
              <PaymentSequence copy="primary" />
              <PaymentSequence copy="duplicate" />
            </div>
          </div>
        </div>

        <div className={styles.mobileActions}>
          <Link href="/auth/sign-up">Get Started Free <span>→</span></Link>
          <button type="button" onClick={() => setDemoOpen(true)}>
            <span aria-hidden="true">▶</span> Watch Demo
          </button>
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
