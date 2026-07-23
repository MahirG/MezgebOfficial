import type { Metadata } from 'next';
import Link from 'next/link';
import { EmbeddedMezgebApp } from '@/components/embedded-mezgeb-app';
import './app.css';

export const metadata: Metadata = {
  title: 'Mezgeb application',
  description: 'Open the complete Mezgeb business-ledger application without leaving the Mezgeb website.'
};

export default function MezgebAppPage() {
  return (
    <main id="main-content" className="embeddedAppPage">
      <section className="container appRouteIntro">
        <p className="overline">Mezgeb application</p>
        <h1>The full Mezgeb experience, inside the website.</h1>
        <p>
          Record sample sales and expenses, explore VAT receipts, Dube, mobile-money views,
          reports, inventory, suppliers and application settings without leaving Mezgeb.
        </p>
        <div className="appRouteActions">
          <a className="button primary" href="#mezgeb-application">Open application</a>
          <Link className="textButton" href="/demo">Open quick demo →</Link>
          <Link className="textButton" href="/dashboard">Production dashboard →</Link>
        </div>
      </section>

      <section
        className="container embeddedAppShell"
        id="mezgeb-application"
        aria-label="Embedded Mezgeb application"
      >
        <div className="embeddedAppBar">
          <div>
            <span className="embeddedStatusDot" aria-hidden="true" />
            <strong>Mezgeb መዝገብ</strong>
            <small>Interactive application · sample data</small>
          </div>
          <span>Website-branded application</span>
        </div>
        <EmbeddedMezgebApp showFullscreenControl />
      </section>

      <section className="container appRouteNotice">
        <strong>Prototype status</strong>
        <p>
          This integrated application currently uses sample, browser-local interactions. Do not
          enter real financial, customer, TIN or personal information until the dedicated Mezgeb
          backend and production controls are configured.
        </p>
      </section>
    </main>
  );
}
