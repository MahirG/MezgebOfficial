import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest { return { name: 'Mezgeb መዝገብ', short_name: 'Mezgeb', description: 'Business ledger for Ethiopian small businesses.', start_url: '/', display: 'standalone', background_color: '#f5f5f7', theme_color: '#f5f5f7', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }] }; }
