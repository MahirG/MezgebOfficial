'use client';

/* eslint-disable @next/next/no-img-element */
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

const navigationLinks = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Resources', href: '/help' },
  { label: 'About Us', href: '/#ethiopia' }
] as const;

const desktopHotspots = [
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

function PaymentSequence({ duplicate = false }: { duplicate?: boolean }) {
  const tabIndex = duplicate ? -1 : undefined;

  return (
    <div className={styles.marqueeGroup} aria-hidden={duplicate || undefined}>
      <Link
        className={styles.paymentLink}
        href="/#pricing"
        aria-label="View Visa payment options"
        tabIndex={tabIndex}
      >
        <PaymentBrand type="visa" />
      </Link>
      <Link
        className={styles.paymentLink}
        href="/#pricing"
        aria-label="View Mastercard payment options"
        tabIndex={tabIndex}
      >
        <PaymentBrand type="mastercard" />
      </Link>
      {trustedPayments.map((method) => (
        <Link
          className={styles.paymentLink}
          href="/#pricing"
          aria-label={`View ${method.shortLabel} payment options`}
          key={`${duplicate ? 'duplicate' : 'primary'}-${method.code}`}
          tabIndex={tabIndex}
        >
          <span className={styles.paymentBrand}>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => menuCloseRef.current?.focus());

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <>
      <div className={styles.heroFrame} data-marketing-hero>
        <div className={styles.heroCanvas}>
          <picture className={styles.heroPicture}>
            <source
              media="(max-width: 900px)"
              srcSet="/images/biloo-hero-mobile.webp?v=20260730-4k"
            />
            <img
              className={styles.heroArtwork}
              src="/images/biloo-hero-desktop.webp?v=20260730-4k"
              alt="Biloo Mezgeb business management platform presented by an Ethiopian business owner"
              width="3840"
              height="2560"
              decoding="async"
              fetchPriority="high"
            />
          </picture>

          <nav className={styles.desktopHotspots} aria-label="Hero navigation">
            {desktopHotspots.map((item) => (
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

          <nav className={styles.mobileHotspots} aria-label="Mobile hero navigation">
            <Link
              className={`${styles.hotspot} ${styles.mobileBrandHotspot}`}
              href="/"
              aria-label="Biloo Mezgeb home"
            />
            <button
              className={`${styles.hotspot} ${styles.mobileMenuHotspot}`}
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="biloo-mobile-menu"
              onClick={() => setMenuOpen(true)}
            />
            <Link
              className={`${styles.hotspot} ${styles.mobileTrialHotspot}`}
              href="/auth/sign-up"
              aria-label="Get Started Free"
            />
            <button
              className={`${styles.hotspot} ${styles.mobileDemoHotspot}`}
              type="button"
              aria-label="Watch Demo"
              onClick={() => setDemoOpen(true)}
            />
          </nav>

          <div className={styles.marqueeViewport} aria-label="Supported payment channels">
            <div className={styles.marqueeTrack}>
              <PaymentSequence />
              <PaymentSequence duplicate />
            </div>
          </div>
        </div>
      </div>

      {menuOpen ? (
        <div className={styles.mobileMenuLayer}>
          <button
            className={styles.mobileMenuBackdrop}
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className={styles.mobileMenuPanel}
            id="biloo-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Biloo Mezgeb navigation"
          >
            <header>
              <Link href="/" onClick={() => setMenuOpen(false)}>
                <span aria-hidden="true">◎</span>
                <strong>Biloo Mezgeb</strong>
              </Link>
              <button
                ref={menuCloseRef}
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMenuOpen(false)}
              >
                ×
              </button>
            </header>
            <nav>
              {navigationLinks.map((item) => (
                <Link href={item.href} key={item.label} onClick={() => setMenuOpen(false)}>
                  <span>{item.label}</span>
                  <i aria-hidden="true">→</i>
                </Link>
              ))}
            </nav>
            <div className={styles.mobileMenuActions}>
              <Link href="/auth/sign-in" onClick={() => setMenuOpen(false)}>
                Log in
              </Link>
              <Link href="/auth/sign-up" onClick={() => setMenuOpen(false)}>
                Get Started
              </Link>
            </div>
          </aside>
        </div>
      ) : null}

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
