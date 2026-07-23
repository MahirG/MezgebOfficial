import Link from 'next/link';
import { ConfirmEmailCard } from '@/components/confirm-email-card';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CheckEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawEmail = params.email;
  const email = typeof rawEmail === 'string' ? rawEmail : '';

  return (
    <main id="main-content" className="authPage">
      <section>
        <p className="overline">One last step</p>
        <h1>Check your email.</h1>
        <p>Your Mezgeb account stays protected until the registration email is confirmed.</p>
        <ConfirmEmailCard initialEmail={email} />
        <small>
          Used the wrong address? <Link href="/auth/sign-up">Register again</Link>
        </small>
      </section>
    </main>
  );
}
