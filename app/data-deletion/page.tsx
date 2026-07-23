import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
export const metadata: Metadata = { title: 'Data deletion' };
export default function Deletion(){ return <LegalPage title="Data deletion instructions" updated="23 July 2026"><h2>Demo data</h2><p>Use the reset button on the demo page or clear this site’s browser storage. No demo transaction data is sent to the server.</p><h2>Production account</h2><p>After production launch, users can request deletion from account settings. The request is recorded, identity is verified and eligible data is removed or anonymized.</p><h2>Legal retention</h2><p>Some financial records may be retained where required by law. The user will be told what remains and why.</p></LegalPage>; }
