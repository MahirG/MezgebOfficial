import Image from 'next/image';
import Link from 'next/link';
import styles from './home-hero.module.css';
import flowStyles from './payment-flow.module.css';

const paymentBrands = [
  {
    name: 'telebirr',
    source: 'https://raw.githubusercontent.com/Chapa-Et/ethiopianlogos/main/logos/tele_birr/tele_birr.svg',
    className: flowStyles.telebirr
  },
  {
    name: 'M-PESA',
    source: 'https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg',
    className: flowStyles.mpesa
  },
  {
    name: 'CBE Birr',
    source: 'https://raw.githubusercontent.com/Chapa-Et/ethiopianlogos/main/logos/cbe_birr_light/cbe_birr_light.svg',
    className: flowStyles.cbeBirr
  },
  {
    name: 'Amole',
    source: 'https://raw.githubusercontent.com/Chapa-Et/ethiopianlogos/main/logos/amole/amole.svg',
    className: flowStyles.amole
  },
  {
    name: 'Chapa',
    source: 'https://raw.githubusercontent.com/Chapa-Et/ethiopianlogos/main/logos/chapa/chapa.svg',
    className: flowStyles.chapa
  },
  {
    name: 'Kacha',
    source: 'https://raw.githubusercontent.com/Chapa-Et/ethiopianlogos/main/logos/kacha/kacha.svg',
    className: flowStyles.kacha
  }
] as const;

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
            sizes="(max-width: 880px) 100vw, 52vw"
          />

          <div className={flowStyles.paymentFlow} aria-label="Ethiopian payment methods">
            <div className={flowStyles.paymentTrack} aria-hidden="true">
              {[...paymentBrands, ...paymentBrands].map((brand, index) => (
                <span
                  className={`${flowStyles.paymentChip} ${brand.className}`}
                  data-payment-brand={brand.name}
                  key={`${brand.name}-${index}`}
                >
                  {/* The brand assets are decorative and retain a text fallback beside each mark. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brand.source}
                    alt=""
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <strong>{brand.name}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
