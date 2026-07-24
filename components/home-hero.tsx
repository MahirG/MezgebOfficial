import Image from 'next/image';
import Link from 'next/link';
import { paymentMethods, type PaymentMethodCode } from '@/lib/payment-methods';
import styles from './home-hero.module.css';
import flowStyles from './payment-flow.module.css';

const paymentClassNames: Record<PaymentMethodCode, string> = {
  telebirr: flowStyles.telebirr,
  mpesa: flowStyles.mpesa,
  cbe_birr: flowStyles.cbeBirr,
  amole: flowStyles.amole,
  kacha: flowStyles.kacha,
  chapa: flowStyles.chapa
};

export function HomeHero() {
  return (
    <div className={styles.homeHero}>
      <div className={styles.copy}>
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
        <div className={flowStyles.presenterStage}>
          <Image
            className={styles.presenter}
            src="/images/mezgeb-presenter.webp"
            alt="Smiling Ethiopian woman holding an iPhone that displays the Mezgeb mobile business application"
            width={600}
            height={567}
            priority
            unoptimized
            sizes="(max-width: 560px) 76vw, (max-width: 880px) 90vw, 52vw"
          />

          <div className={flowStyles.paymentFlow} aria-label="Ethiopian payment methods">
            <div className={flowStyles.paymentTrack} aria-hidden="true">
              {[...paymentMethods, ...paymentMethods].map((brand, index) => (
                <span
                  className={`${flowStyles.paymentChip} ${paymentClassNames[brand.code]}`}
                  data-payment-brand={brand.name}
                  key={`${brand.code}-${index}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brand.source}
                    alt=""
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <strong>{brand.shortLabel}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
