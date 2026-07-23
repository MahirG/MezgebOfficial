import Link from 'next/link';
import { redirect } from 'next/navigation';
import { UpdatePasswordForm } from '@/components/update-password-form';
import { createClient } from '@/lib/supabase/server';

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect('/auth/forgot-password?error=expired');

  return (
    <main id="main-content" className="authPage">
      <section>
        <p className="overline">Secure password</p>
        <h1>Choose a new password.</h1>
        <p>Use a unique password with at least eight characters. Your active recovery session is protected by Supabase Auth.</p>
        <UpdatePasswordForm />
        <small><Link href="/dashboard">Return to dashboard</Link></small>
      </section>
    </main>
  );
}
