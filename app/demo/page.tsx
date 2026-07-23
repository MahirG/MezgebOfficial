import type { Metadata } from 'next';
import { DemoDashboard } from '@/components/demo-dashboard';
export const metadata: Metadata = { title: 'Interactive demo', description: 'Try Mezgeb with sample, local-only data.' };
export default function DemoPage(){ return <main id="main-content" className="pageShell container"><p className="overline">Interactive product prototype</p><h1>Try Mezgeb without using real business data.</h1><p className="pageLead">This demo stores nothing on a server and must not be used for real financial or personal information.</p><DemoDashboard /></main>; }
