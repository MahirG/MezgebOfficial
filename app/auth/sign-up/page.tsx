import Link from 'next/link';
import { EthiopianSignUpForm } from '@/components/ethiopian-sign-up-form';

export default function SignUpPage() {
  return (
    <main id="main-content" className="authPage authPageWide">
      <section>
        <p className="overline">Create your Ethiopian business account</p>
        <h1>Start your secure business record.</h1>
        <p>
          Register with your contact, location, and limited identity details. Confirm your email before entering the protected Mezgeb workspace.
        </p>
        <EthiopianSignUpForm />
        <small>Already registered? <Link href="/auth/sign-in">Sign in</Link></small>
      </section>
    </main>
  );
}
