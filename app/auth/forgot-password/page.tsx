import Link from 'next/link';
import { PasswordRecoveryForm } from '@/components/password-recovery-form';

export default function ForgotPasswordPage() {
  return (
    <main id="main-content" className="authPage">
      <section>
        <p className="overline">Account recovery</p>
        <h1>Reset your Mezgeb password.</h1>
        <p>Enter your registered email. We will send a secure link that lets you choose a new password.</p>
        <PasswordRecoveryForm />
        <small>Remembered it? <Link href="/auth/sign-in">Return to sign in</Link></small>
      </section>
    </main>
  );
}
