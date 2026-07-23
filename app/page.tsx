import Link from 'next/link';
import { EarlyAccessForm } from '@/components/early-access-form';
import { HeroDashboard } from '@/components/hero-dashboard';
import { PricingSection } from '@/components/pricing-section';
import { getPricingData } from '@/lib/pricing';
import styles from './marketing.module.css';

const businessOutcomes = [
  {
    number: '01',
    label: 'Daily clarity',
    title: 'Know what came in, what went out, and what remains.',
    copy: 'Bring sales, expenses, cash, bank activity and mobile-money records into one understandable business view.'
  },
  {
    number: '02',
    label: 'Customer control',
    title: 'Turn informal Dube into a record you can follow.',
    copy: 'Keep customer balances, repayments, overdue credit and settled accounts organized without relying on memory.'
  },
  {
    number: '03',
    label: 'Professional operation',
    title: 'Move from scattered notes to a business system.',
    copy: 'Create structured receipts, review reports and keep each business workspace separated under one secure account.'
  }
] as const;

const productCapabilities = [
  {
    className: styles.featureLedger,
    eyebrow: 'Ledger',
    title: 'Every transaction, recorded with context.',
    copy: 'Capture sales, expenses, supplier purchases, corrections and payment channels in a consistent daily workflow.',
    visual: (
      <div className={styles.miniLedger} aria-hidden="true">
        <span><i className={styles.incomeIcon}>↗</i><b>Morning sales</b><em>+ ETB 3,840</em></span>
        <span><i className={styles.expenseIcon}>↘</i><b>Supplier purchase</b><em>− ETB 1,260</em></span>
        <span><i className={styles.neutralIcon}>✓</i><b>Closing balance</b><em>ETB 48,250</em></span>
      </div>
    )
  },
  {
    className: styles.featureDube,
    eyebrow: 'Dube',
    title: 'Customer credit without confusion.',
    copy: 'See who owes the business, what they paid and which balances still need attention.',
    visual: <div className={styles.balanceDial} aria-hidden="true"><strong>ETB 4,200</strong><span>4 open customer balances</span></div>
  },
  {
    className: styles.featureReceipt,
    eyebrow: 'Receipts',
    title: 'Clean records for every sale.',
    copy: 'Prepare numbered receipts with clear totals and VAT-aware calculations inside the same workflow.',
    visual: <div className={styles.receiptMock} aria-hidden="true"><small>MEZGEB RECEIPT</small><span>Subtotal <b>ETB 1,000</b></span><span>VAT 15% <b>ETB 150</b></span><strong>Total · ETB 1,150</strong></div>
  },
  {
    className: styles.featureReports,
    eyebrow: 'Reports',
    title: 'Decisions backed by the business record.',
    copy: 'Review sales, spending, profit direction, category movement and VAT position without rebuilding spreadsheets.',
    visual: <div className={styles.reportBars} aria-hidden="true">{[44, 62, 51, 78, 70, 92, 84].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
  },
  {
    className: styles.featureMobile,
    eyebrow: 'Mobile first',
    title: 'Built for the phone in your hand.',
    copy: 'The Mezgeb workspace fits the mobile screen, uses touch-ready navigation and keeps daily actions close.',
    visual: <div className={styles.phoneMock} aria-hidden="true"><span>Today</span><strong>ETB 48,250</strong><div><i>＋</i><i>▤</i><i>◎</i></div></div>
  }
] as const;

const localWorkflows = [
  ['ETB-first accounting', 'Amounts, summaries and pricing are presented in Ethiopian birr.'],
  ['Dube customer credit', 'A familiar local business practice becomes traceable and reviewable.'],
  ['Local payment awareness', 'Cash, bank, Telebirr, M-Pesa and CBE Birr can be represented in one operating view.'],
  ['Language-ready experience', 'The product direction includes English, Amharic, Afaan Oromo and Tigrinya preferences.']
] as const;

const securityPoints = [
  ['Confirmed accounts', 'Email confirmation and password recovery are connected through Supabase Auth.'],
  ['Protected ownership', 'Row Level Security separates each authenticated owner’s business records.'],
  ['Server-controlled pricing', 'Plan prices, trials and billing status are normalized by the database.'],
  ['Limited identity storage', 'Registration keeps only the document type and final four characters—not the full number.']
] as const;

export const revalidate = 300;

export default async function Home() {
  const pricing = await getPricingData();

  return (
    <main id="main-content" className={styles.marketing}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.releaseBar}>
            <span>New</span>
            <p>Secure accounts, Ethiopian registration and Supabase-backed pricing are now connected.</p>
            <Link href="/auth/sign-up">Create an account →</Link>
          </div>

          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Business management, built for Ethiopia</p>
            <h1>Run the business.<span>Know every birr.</span></h1>
            <p className={styles.heroLead}>Mezgeb brings the daily ledger, Dube customer credit, receipts, payment channels and performance reporting into one focused operating system for Ethiopian businesses.</p>
            <div className={styles.heroActions}>
              <Link className="button primary" href="/auth/sign-up">Create free account</Link>
              <Link className={styles.secondaryAction} href="/app">Explore the product <span>↗</span></Link>
            </div>
            <div className={styles.heroSignals} aria-label="Product highlights">
              <span><b>ETB</b> first</span>
              <span><b>15%</b> VAT workflow</span>
              <span><b>Dube</b> built in</span>
              <span><b>Mobile</b> ready</span>
            </div>
          </div>

          <div className={styles.heroProduct}>
            <div className={styles.productGlow} aria-hidden="true" />
            <HeroDashboard />
            <div className={styles.floatingCardLeft} aria-hidden="true"><small>Today’s sales</small><strong>ETB 3,840</strong><span>Recorded clearly</span></div>
            <div className={styles.floatingCardRight} aria-hidden="true"><small>Dube collected</small><strong>ETB 1,200</strong><span>Balance updated</span></div>
          </div>
        </div>
      </section>

      <section className={styles.positioningStrip} aria-label="Mezgeb product positioning">
        <div className="container">
          <p>One business record for</p>
          <div><span>Retail</span><i>•</i><span>Cafés</span><i>•</i><span>Services</span><i>•</i><span>Distribution</span><i>•</i><span>Growing teams</span></div>
        </div>
      </section>

      <section className={styles.outcomesSection}>
        <div className="container">
          <header className={styles.sectionIntro}>
            <p className={styles.eyebrow}>A stronger daily operating habit</p>
            <h2>Clarity is not another report.<br />It starts with every transaction.</h2>
            <p>Mezgeb is designed to make good recordkeeping feel like part of running the business—not a separate accounting project at the end of the month.</p>
          </header>
          <div className={styles.outcomeGrid}>
            {businessOutcomes.map((outcome) => (
              <article key={outcome.number}>
                <div><span>{outcome.number}</span><small>{outcome.label}</small></div>
                <h3>{outcome.title}</h3>
                <p>{outcome.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.productSection} id="features">
        <div className="container">
          <header className={styles.sectionIntro}>
            <p className={styles.eyebrow}>The Mezgeb workspace</p>
            <h2>One system for the work<br />that keeps the business moving.</h2>
            <p>Each capability is designed to connect with the same business record, so the owner can move from activity to understanding without switching tools.</p>
          </header>
          <div className={styles.featureGrid}>
            {productCapabilities.map((feature) => (
              <article className={`${styles.featureCard} ${feature.className}`} key={feature.title}>
                <div className={styles.featureCopy}>
                  <p>{feature.eyebrow}</p>
                  <h3>{feature.title}</h3>
                  <span>{feature.copy}</span>
                </div>
                {feature.visual}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.localSection} id="ethiopia">
        <div className="container">
          <div className={styles.localPanel}>
            <div className={styles.localCopy}>
              <p className={styles.eyebrow}>Ethiopian by design</p>
              <h2>Local business reality is not an add-on.</h2>
              <p>Mezgeb’s product language begins with the way Ethiopian businesses already operate: birr, Dube, local payment channels, multilingual teams and practical daily records.</p>
              <Link className={styles.darkLink} href="/auth/sign-up">Build your business record <span>→</span></Link>
            </div>
            <div className={styles.localGrid}>
              {localWorkflows.map(([title, copy]) => <article key={title}><i>✓</i><div><h3>{title}</h3><p>{copy}</p></div></article>)}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.workflowSection}>
        <div className="container">
          <header className={styles.sectionIntro}>
            <p className={styles.eyebrow}>A clear business day</p>
            <h2>From opening time<br />to the closing balance.</h2>
          </header>
          <div className={styles.workflowTrack}>
            {[
              ['Morning', 'Open the workspace', 'Start with the current cash, Dube and business position.'],
              ['During the day', 'Record activity', 'Add sales, expenses, credit, repayments and supplier purchases as they happen.'],
              ['At the counter', 'Create the record', 'Prepare a receipt and keep the payment method connected to the sale.'],
              ['Closing time', 'Understand the day', 'Review totals, outstanding balances and the direction of the business.']
            ].map(([time, title, copy], index) => (
              <article key={title}><span>0{index + 1}</span><small>{time}</small><h3>{title}</h3><p>{copy}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.securitySection}>
        <div className="container">
          <div className={styles.securityHeader}>
            <div>
              <p className={styles.eyebrow}>Trust is part of the product</p>
              <h2>A business record should feel private, controlled and recoverable.</h2>
            </div>
            <div>
              <p>Mezgeb’s account foundation uses confirmed authentication, protected database ownership and server-enforced subscription rules.</p>
              <Link href="/security">Review the security model →</Link>
            </div>
          </div>
          <div className={styles.securityGrid}>
            {securityPoints.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}
          </div>
        </div>
      </section>

      <PricingSection plans={pricing.plans} subscription={pricing.subscription} />

      <section className={styles.finalCta}>
        <div className="container">
          <div className={styles.finalCtaPanel}>
            <div>
              <p className={styles.eyebrow}>Start with one clear record</p>
              <h2>Your business deserves more than scattered notes.</h2>
              <p>Create a secure Mezgeb account, confirm your email and begin setting up the workspace around your business.</p>
              <div className={styles.heroActions}>
                <Link className="button primary" href="/auth/sign-up">Create free account</Link>
                <Link className={styles.secondaryAction} href="/auth/sign-in">Sign in</Link>
              </div>
            </div>
            <div className={styles.ctaMark} aria-hidden="true"><span>መ</span><small>Every birr.<br />Clearly recorded.</small></div>
          </div>
        </div>
      </section>

      <section className={styles.updatesSection} id="updates">
        <div className="container">
          <div className={styles.updatesCopy}>
            <p className={styles.eyebrow}>Product updates</p>
            <h2>Follow Mezgeb as the operational modules move fully into Supabase.</h2>
            <p>Accounts, registration, business onboarding and pricing are connected. Join the update list for progress on persistent ledger, Dube, receipts, inventory and reports.</p>
          </div>
          <EarlyAccessForm />
        </div>
      </section>
    </main>
  );
}
