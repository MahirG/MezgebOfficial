import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';

export const metadata: Metadata = { title: 'Privacy policy' };

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated="23 July 2026">
      <h2>Prototype and production distinction</h2>
      <p>The interactive demo uses sample data and local browser state. Production accounts may process profile, business, transaction, customer, receipt, subscription and support information after backend configuration and launch approval.</p>

      <h2>Registration information</h2>
      <p>Registration may collect a legal name, Ethiopian mobile number, email address, region, city or woreda, preferred language, business role and identity-document type. During registration, Mezgeb retains only the final four characters of the identity number. The complete document number is used for client-side format validation and is not sent to or stored in the Mezgeb database.</p>

      <h2>Identity verification status</h2>
      <p>Providing an identity type and final four characters does not mean that the identity has been verified. Accounts remain marked unverified until Mezgeb connects an approved verification provider and completes the required consent, security and legal review.</p>

      <h2>Pricing and subscriptions</h2>
      <p>Mezgeb stores the selected plan, billing cycle, subscription status and ETB price snapshot. Selecting a paid plan does not constitute payment. A paid subscription remains pending until a verified payment provider confirms the transaction through a secure server-side process.</p>

      <h2>Purposes</h2>
      <p>Information is used to operate the ledger, provide authentication, localize the account, prevent abuse, manage plan access, generate reports, support users and meet legal obligations.</p>

      <h2>Retention and deletion</h2>
      <p>Users may request deletion. Financial records may require legally permitted retention. Identity fragments and subscription records should be deleted or anonymized when no longer required for their stated purpose, subject to applicable legal obligations.</p>

      <h2>Contact</h2>
      <p>Use the repository security channel or the official support contact configured for production.</p>
    </LegalPage>
  );
}
