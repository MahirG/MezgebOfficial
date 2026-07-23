import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : '';
  const message = params.message === 'signed-out' ? 'You have been signed out securely.' : '';

  return (
    <main id="main-content" className="authPage">
      <section>
        <p className="overline">Secure account</p>
        <h1>Welcome back to Mezgeb.</h1>
        <p>Sign in to access your protected businesses, ledger records, Dube balances, receipts and reports.</p>
        {error ? <div className="authError" role="alert">{error}</div> : null}
        {message ? <div className="authSuccess" role="status">{message}</div> : null}
        <AuthForm mode="sign-in" />
        <small>No account? <Link href="/auth/sign-up">Create one securely</Link></small>
      </section>
    </main>
  );
}
