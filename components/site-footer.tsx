import Link from 'next/link';
import { Logo } from './logo';

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="container footerGrid">
        <div className="footerLead">
          <Logo />
          <p>One clear business record for sales, expenses, Dube, receipts, payment channels and performance—designed around Ethiopian business reality.</p>
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
          <Link href="/auth/sign-up">Create free account</Link>
          <Link href="/auth/sign-in">Sign in</Link>
          <Link href="/dashboard">Account dashboard</Link>
          <Link href="/#updates">Product updates</Link>
        </div>
      </div>
      <div className="container footerBottom">
        <span>© 2026 Mezgeb Technologies.</span>
        <span>መዝገብ — Every birr, clearly recorded.</span>
      </div>
    </footer>
  );
}
