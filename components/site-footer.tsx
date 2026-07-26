import Link from 'next/link';
import { Logo } from './logo';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="siteFooter">
      <div className="container footerCta">
        <div className="footerCtaCopy">
          <p className="footerEyebrow">Built for ambitious Ethiopian businesses</p>
          <h2>Turn every birr into a clear business decision.</h2>
          <p>
            Start with one secure record for sales, expenses, Dube, receipts and the performance of
            your business.
          </p>
        </div>
        <div className="footerCtaActions">
          <Link className="button primary" href="/auth/sign-up">
            Start 14-day trial
          </Link>
          <Link className="button footerGhost" href="/demo">
            Explore the demo
          </Link>
        </div>
      </div>

      <div className="container footerGrid">
        <div className="footerLead">
          <Logo />
          <p>
            One clear business record for sales, expenses, Dube, receipts, payment channels and
            performance—designed around Ethiopian business reality.
          </p>
          <span className="footerTrustPill">
            <i aria-hidden="true" /> Supabase-backed secure workspace
          </span>
        </div>
        <div>
          <h3>Product</h3>
          <Link href="/#features">Product overview</Link>
          <Link href="/app">Explore the app</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/demo">Quick demo</Link>
        </div>
        <div>
          <h3>Trust</h3>
          <Link href="/security">Security model</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/data-deletion">Data deletion</Link>
        </div>
        <div>
          <h3>Account</h3>
          <Link href="/auth/sign-up">Start 14-day trial</Link>
          <Link href="/auth/sign-in">Sign in</Link>
          <Link href="/dashboard">Account dashboard</Link>
          <Link href="/#updates">Product updates</Link>
        </div>
      </div>

      <div className="container footerBottom">
        <span>© {year} Mezgeb Technologies.</span>
        <span>መዝገብ — Every birr, clearly recorded.</span>
        <span className="poweredByHisab">
          Powered by{' '}
          <a href="https://hisabtech.com" target="_blank" rel="noreferrer">
            Hisabtech.com
          </a>
        </span>
      </div>
    </footer>
  );
}
