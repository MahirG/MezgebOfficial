import type { Metadata, Viewport } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { siteUrl } from '@/lib/env';
import './globals.css';
import './registration.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Mezgeb መዝገብ — Business clearly recorded', template: '%s · Mezgeb' },
  description: 'Sales, expenses, VAT-ready receipts, Dube customer credit, mobile money and reports for Ethiopian small businesses.',
  keywords: ['Ethiopia business ledger', 'VAT receipt Ethiopia', 'Dube credit book', 'small business accounting', 'Mezgeb'],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'en_ET', siteName: 'Mezgeb', title: 'Mezgeb መዝገብ', description: 'Your business. Clearly recorded.', url: '/' },
  twitter: { card: 'summary_large_image', title: 'Mezgeb መዝገብ', description: 'Your business. Clearly recorded.' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' }
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f5f5f7', colorScheme: 'light' };

const jsonLd = {
  '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Mezgeb', alternateName: 'Mezgeb መዝገብ', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', description: 'A digital business ledger designed for Ethiopian small businesses.', offers: [{ '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'ETB' }, { '@type': 'Offer', name: 'Mezgeb Pro', price: '299', priceCurrency: 'ETB' }]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skipLink" href="#main-content">Skip to content</a><SiteHeader />{children}<SiteFooter /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /></body></html>;
}
