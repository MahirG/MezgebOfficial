import type { Metadata, Viewport } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { siteUrl } from '@/lib/env';
import './globals.css';
import './registration.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Mezgeb መዝገብ — Business management built for Ethiopia', template: '%s · Mezgeb' },
  description: 'Run sales, expenses, Dube customer credit, receipts, payment channels and performance reporting in one clear operating system for Ethiopian businesses.',
  keywords: ['Ethiopia business management', 'Ethiopian business ledger', 'Dube credit book', 'VAT receipt Ethiopia', 'small business accounting', 'Mezgeb'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_ET',
    siteName: 'Mezgeb',
    title: 'Mezgeb መዝገብ — Run the business. Know every birr.',
    description: 'One clear business record for Ethiopian sales, expenses, Dube, receipts and performance.',
    url: '/'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mezgeb መዝገብ — Run the business. Know every birr.',
    description: 'Business management designed around Ethiopian business reality.'
  },
  icons: { icon: '/icon.svg', apple: '/icon.svg' }
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f5f5f7', colorScheme: 'light' };

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Mezgeb',
  alternateName: 'Mezgeb መዝገብ',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'A business management and ledger application designed around Ethiopian sales, expenses, Dube customer credit, receipts and reporting.',
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'ETB' },
    { '@type': 'Offer', name: 'Mezgeb Pro', price: '299', priceCurrency: 'ETB' }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skipLink" href="#main-content">Skip to content</a><SiteHeader />{children}<SiteFooter /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /></body></html>;
}
