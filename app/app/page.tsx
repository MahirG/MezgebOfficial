import type { Metadata } from 'next';
import Link from 'next/link';
import { MezgebApplication } from '@/components/mezgeb-application';
import './app.css';

export const metadata: Metadata = {
  title: 'Mezgeb application',
  description: 'Use the Mezgeb business-ledger application without leaving the Mezgeb website.'
};

export default function MezgebAppPage() {
  return (
    <main id="main-content" className="mezgebAppPage">
      <section className="container appRouteIntro">
        <p className="overline">Mezgeb application</p>
        <h1>Your business workspace, built into the website.</h1>
        <p>
          Record sample sales and expenses, prepare VAT receipts, manage Dube, review reports,
          track mobile money, inventory and suppliers from one consistent Mezgeb experience.
        </p>
        <div className="appRouteActions">
          <a className="button primary" href="#mezgeb-application">Open application</a>
          <Link className="textButton" href="/demo">Open quick demo →</Link>
          <Link className="textButton" href="/dashboard">Production dashboard →</Link>
        </div>
      </section>

      <section className="container nativeAppShell" id="mezgeb-application" aria-label="Mezgeb application">
        <MezgebApplication />
      </section>

      <section className="container appRouteNotice">
        <strong>Interactive prototype</strong>
        <p>
          Entries are stored only in this browser. Do not enter real financial, customer, TIN or
          personal information until the dedicated Mezgeb backend and production controls are configured.
        </p>
      </section>
    </main>
  );
}
