import Image from 'next/image';
import Link from 'next/link';
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
          Mezgeb brings the daily ledger, Dube customer credit, receipts, payment channels and performance reporting into one focused mobile operating system for Ethiopian businesses.
        </p>
        <div className={styles.actions}>
          <Link className="button primary" href="/auth/sign-up">Start 14-day trial</Link>
          <Link className={styles.secondaryAction} href="/demo">Explore the mobile app <span>↗</span></Link>
        </div>
        <div className={styles.signals} aria-label="Product highlights">
          <span><b>ETB</b> first</span>
          <span><b>15%</b> VAT workflow</span>
          <span><b>Dube</b> built in</span>
          <span><b>Realtime</b> sync</span>
        </div>
      </div>

      <div className={styles.visual}>
        <Image
          className={styles.presenter}
          src="/images/mezgeb-presenter.webp"
          alt="Smiling Ethiopian woman holding an iPhone that displays the Mezgeb mobile business application"
          width={1100}
          height={1040}
          priority
          quality={92}
          sizes="(max-width: 880px) 100vw, 52vw"
        />
      </div>
    </div>
  );
}
