import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';

export default function SignUpPage() {
  return (
    <main id="main-content" className="authPage">
      <section>
        <p className="overline">Create your account</p>
        <h1>Start your secure business record.</h1>
        <p>Create a Mezgeb account, confirm your email, and set up your first business workspace.</p>
        <AuthForm mode="sign-up" />
        <small>Already registered? <Link href="/auth/sign-in">Sign in</Link></small>
      </section>
    </main>
  );
}
