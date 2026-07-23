'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function PasswordRecoveryForm() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    if (!email) {
      setStatus('Enter your registered email address.');
      return;
    }

    setBusy(true);
    setStatus('Preparing your secure reset link…');

    try {
      const callback = new URL('/auth/callback', window.location.origin);
      callback.searchParams.set('next', '/auth/update-password');
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callback.toString()
      });
      if (error) throw error;
      setStatus('Check your email. A password-reset link has been sent when the account exists.');
      event.currentTarget.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The reset request could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="authForm" onSubmit={submit}>
      <label>
        Email address
        <input type="email" name="email" required autoComplete="email" inputMode="email" />
      </label>
      <button className="button primary authSubmit" type="submit" disabled={busy}>
        {busy ? 'Please wait…' : 'Send password-reset link'}
      </button>
      <p className="authStatus" role="status" aria-live="polite">{status}</p>
    </form>
  );
}
