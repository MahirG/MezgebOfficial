import type { Metadata } from 'next';
import Link from 'next/link';
import './help.css';

export const metadata: Metadata = {
  title: 'Mezgeb Help Center',
  description:
    'Guidance for transactions, Dube, receipts, reports, security and account support in Mezgeb.'
};

const guides = [
  {
    icon: '↕',
    title: 'Record sales and expenses',
    text: 'Open Ledger, choose Sale or Expense, add the amount and payment method, then save the protected entry.'
  },
  {
    icon: '◎',
    title: 'Manage Dube safely',
    text: 'Add the customer first, set an optional credit limit, and record every credit sale or payment from the Dube workspace.'
  },
  {
    icon: '▤',
    title: 'Issue a receipt',
    text: 'Open Receipts after saving a sale. Mezgeb creates a numbered receipt and prevents accidental duplicate issuance.'
  },
  {
    icon: '⌁',
    title: 'Review reports',
    text: 'Reports calculate sales, expenses, net position, Dube exposure and VAT visibility from the saved ledger.'
  },
  {
    icon: '⌕',
    title: 'Search the workspace',
    text: 'Use the mobile search bar or Command/Control + K to find transactions, customers, receipts, settings and app sections.'
  },
  {
    icon: '◈',
    title: 'Language and appearance',
    text: 'Open the mobile hamburger menu to change language or switch between premium light and dark modes.'
  }
];

export default function HelpPage() {
  return (
    <main className="mezgebHelpPage">
      <header className="mezgebHelpHeader">
        <Link href="/app" className="mezgebHelpBrand" aria-label="Back to Mezgeb app">
          <span className="mezgebHelpMark">
            M<i />
          </span>
          <span>
            <strong>Mezgeb</strong>
            <small>Help Center</small>
          </span>
        </Link>
        <Link href="/app" className="mezgebHelpBack">
          Back to app
        </Link>
      </header>

      <section className="mezgebHelpHero">
        <span>MEZGEB SUPPORT</span>
        <h1>Run your records with confidence.</h1>
        <p>
          Clear guidance for the daily workflows that keep your business ledger accurate, secure and
          ready for review.
        </p>
        <Link href="/app" className="mezgebHelpPrimary">
          Open Mezgeb
        </Link>
      </section>

      <section className="mezgebHelpGrid" aria-label="Mezgeb guides">
        {guides.map((guide) => (
          <article key={guide.title}>
            <i>{guide.icon}</i>
            <h2>{guide.title}</h2>
            <p>{guide.text}</p>
          </article>
        ))}
      </section>

      <section className="mezgebHelpSecurity">
        <div>
          <span>SECURITY</span>
          <h2>Your business data stays isolated.</h2>
          <p>
            Mezgeb uses authenticated access, encrypted transport and Supabase Row Level Security to
            keep each business workspace separated.
          </p>
        </div>
        <Link href="/privacy">Review privacy</Link>
      </section>
    </main>
  );
}
