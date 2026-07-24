import Image from 'next/image';
import Link from 'next/link';
import { heroPresenterDataUrl } from '@/lib/hero-presenter-image';
import styles from './home-hero.module.css';

export function HomeHero() {
  return (
    <div className={styles.homeHero}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Business management, built for Ethiopia</p>
        <h1>
          Run the business.
          <span>Know every birr.</span>
        </h1>
        <p className={styles.lead}>
          Mezgeb brings the daily ledger, Dube customer credit, receipts, payment channels and performance reporting into one focused operating system for Ethiopian businesses.
        </p>
        <div className={styles.actions}>
          <Link className="button primary" href="/auth/sign-up">Start 14-day trial</Link>
          <Link className={styles.secondaryAction} href="/demo">Explore the product <span>↗</span></Link>
        </div>
        <div className={styles.signals} aria-label="Product highlights">
          <span><b>ETB</b> first</span>
          <span><b>15%</b> VAT workflow</span>
          <span><b>Dube</b> built in</span>
          <span><b>Realtime</b> sync</span>
        </div>
      </div>

      <div className={styles.visual}>
        <div className={styles.visualGlow} aria-hidden="true" />
        <Image
          className={styles.presenter}
          src={heroPresenterDataUrl}
          alt="Smiling Ethiopian woman in modest traditional clothing presenting the Mezgeb business application on an iPhone"
          width={1600}
          height={900}
          priority
          unoptimized
          quality={90}
          sizes="(max-width: 900px) 94vw, 52vw"
        />
        <div className={styles.topBadge}>
          <span className={styles.liveDot} aria-hidden="true" />
          Mezgeb mobile workspace
        </div>
        <div className={styles.bottomCard}>
          <small>Everything in one place</small>
          <strong>Sales · Dube · Receipts · Reports</strong>
        </div>
      </div>
    </div>
  );
}
