import Link from 'next/link';
import { Logo } from './logo';

export function SiteFooter() {
  return (
    <footer className="siteFooter">
      <div className="container footerGrid">
        <div className="footerLead"><Logo /><p>Sales, expenses, VAT receipts, Dube, mobile money, reports and business control for Ethiopian small businesses.</p></div>
        <div><h3>Product</h3><Link href="/app">Open Mezgeb app</Link><Link href="/#features">Features</Link><Link href="/pricing">Pricing</Link><Link href="/demo">Quick demo</Link><Link href="/security">Security</Link></div>
        <div><h3>Legal</h3><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/data-deletion">Data deletion</Link></div>
        <div><h3>Account</h3><Link href="/auth/sign-in">Sign in</Link><Link href="/auth/sign-up">Create account</Link><Link href="/dashboard">Dashboard</Link></div>
      </div>
      <div className="container footerBottom"><span>© 2026 Mezgeb Technologies.</span><span>መዝገብ — Every birr, clearly recorded.</span></div>
    </footer>
  );
}
