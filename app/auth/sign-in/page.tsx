import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';

export default function SignInPage() {
  return (
    <main id="main-content" className="authPage">
      <section>
        <p className="overline">Secure account</p>
        <h1>Welcome back to Mezgeb.</h1>
        <p>Sign in to access your protected businesses, ledger records, Dube balances, receipts and reports.</p>
        <AuthForm mode="sign-in" />
        <small>No account? <Link href="/auth/sign-up">Create one securely</Link></small>
      </section>
    </main>
  );
}
