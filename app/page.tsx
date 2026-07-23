import Link from 'next/link';
import { HeroDashboard } from '@/components/hero-dashboard';
import { EarlyAccessForm } from '@/components/early-access-form';
import { PricingPlans } from '@/components/pricing-plans';

const features = [
  ['Ledger', 'Record sales, expenses, supplier purchases and corrections in seconds.', '↗'],
  ['VAT receipts', 'Create auto-numbered receipts with 15% VAT calculations and professional totals.', '▤'],
  ['Dube credit', 'See customer balances, payment history, settled accounts and overdue credit.', '◎'],
  ['Mobile money', 'Bring cash, Telebirr, M-Pesa, CBE Birr and bank records into one view.', '▣'],
  ['Reports', 'Understand profit, category spending, budgets, trends and VAT position.', '⌁'],
  ['Operations', 'Track inventory, suppliers, multiple businesses, TIN and VAT status.', '◇']
];

export default function Home() {
  return <main id="main-content">
    <section className="hero"><div className="container heroGrid"><div className="heroCopy"><p className="overline">Mezgeb መዝገብ</p><h1>Your business.<span>Clearly recorded.</span></h1><p>Mezgeb brings sales, expenses, VAT-ready receipts, Dube customer credit, mobile money and reporting into one beautifully simple operating system for Ethiopian businesses.</p><div className="heroActions"><Link className="button primary" href="/app">Open Mezgeb app</Link><Link className="textButton" href="/demo">Try the quick demo →</Link></div><div className="trustLine"><span>✓ ETB and VAT ready</span><span>✓ English and Amharic</span><span>✓ Access the app inside the website</span></div></div><HeroDashboard /></div></section>

    <section className="darkStatement"><div className="container"><p className="overline light">One complete business view</p><h2>Everything the business needs.<br />Nothing it does not.</h2><div className="statementCards"><article><small>Core promise</small><b>Track every birr, effortlessly.</b></article><article><small>Operational value</small><b>VAT-ready receipts in one tap.</b></article><article><small>Growth value</small><b>Mobile money, Dube and reports together.</b></article></div></div></section>

    <section className="section" id="features"><div className="container"><header className="sectionHeader"><p className="overline">Complete business control</p><h2>More than a ledger.<br />A complete daily business system.</h2><p>Record operations, issue compliant documents, manage credit and understand performance without moving between disconnected tools.</p></header><div className="featureGrid">{features.map(([title, copy, icon], index)=><article className={index < 2 ? 'featureCard large' : 'featureCard'} key={title}><i>{icon}</i><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

    <section className="section localSection" id="ethiopia"><div className="container split"><article className="localStory"><p className="overline">Built for Ethiopia</p><h2>Local business reality is part of the product architecture.</h2><p>ETB-first records, TIN and VAT workflows, English and Amharic support, customer-credit habits and local payment channels are built into Mezgeb’s product direction.</p><ul><li><b>ETB-first records</b><span>Balances, receipts and reports designed for Ethiopian businesses.</span></li><li><b>VAT and TIN workflows</b><span>15% VAT receipts, business profiles and monthly summaries.</span></li><li><b>Mobile money awareness</b><span>Telebirr, M-Pesa, CBE Birr, cash and bank visibility.</span></li></ul></article><article className="complianceCard"><p className="overline light">Compliance visibility</p><h2>Prepared for formal business operation.</h2><div className="statusGrid"><div><small>TIN registration</small><b>01234567 · Verified</b><span>Business profile connected</span></div><div><small>VAT return</small><b>Due in 5 days</b><span>ETB 7,238 payable</span></div><div><small>Receipts</small><b>12 this month</b><span>Auto-numbered</span></div><div><small>Payment channels</small><b>Telebirr · M-Pesa</b><span>Tracked together</span></div></div></article></div></section>

    <section className="section"><div className="container"><header className="sectionHeader"><p className="overline">Simple daily workflow</p><h2>From the first sale to the monthly report.</h2></header><div className="steps">{[['Record activity','Add a sale, expense, credit, payment or supplier purchase.'],['Issue a receipt','Calculate VAT and create a professional numbered document.'],['Follow the money','Connect cash, mobile money, Dube and bank activity.'],['Understand performance','Review profit, spending, VAT, budgets and growth.']].map(([title,copy],i)=><article key={title}><i>0{i+1}</i><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

    <section className="section securityPreview"><div className="container split"><div><p className="overline">Security and trust</p><h2>Records protected by a production-ready architecture.</h2><p>Cookie-based authentication, Row Level Security, encrypted transport, audit logging, data deletion workflows and secure environment-variable practices are included in the repository foundation.</p><Link className="textButton" href="/security">Read the security model →</Link></div><div className="securityTiles"><article><b>Cookie-based sessions</b><span>Supabase SSR and PKCE-ready auth.</span></article><article><b>Row Level Security</b><span>Users access only their business records.</span></article><article><b>Audit logs</b><span>Track sensitive business actions.</span></article><article><b>Integrated application</b><span>Open the complete prototype without leaving the website.</span></article></div></div></section>

    <PricingPlans />

    <section className="section earlyAccess" id="early-access"><div className="container split"><div><p className="overline">Early access</p><h2>Help shape Mezgeb’s production launch.</h2><p>The public site is honest about its status: the product foundation is production-oriented, but live financial use should begin only after a dedicated Supabase project, legal review and deployment verification are complete.</p></div><EarlyAccessForm /></div></section>
  </main>;
}
