'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ConfirmEmailCard({ initialEmail, nextPath }: { initialEmail: string; nextPath: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setStatus('Enter the email address used during registration.');
      return;
    }

    setBusy(true);
    setStatus('Sending a new confirmation email…');
    try {
      const callback = new URL('/auth/callback', window.location.origin);
      callback.searchParams.set('next', nextPath);
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: { emailRedirectTo: callback.toString() }
      });
      if (error) throw error;
      setStatus('Confirmation email sent. Check your inbox and spam folder.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The confirmation email could not be sent.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="authForm">
      <div aria-hidden="true" style={{ fontSize: '3rem', lineHeight: 1 }}>✉️</div>
      <h2 style={{ margin: 0 }}>Confirm your email address</h2>
      <p>We sent a confirmation link to <strong>{email || 'your email address'}</strong>. Open that email and select <strong>Confirm email</strong> before signing in.</p>
      <ol style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--muted)', lineHeight: 1.8 }}>
        <li>Check your inbox and spam folder.</li>
        <li>Open the email from Mezgeb.</li>
        <li>Select the confirmation link.</li>
        <li>Return to Mezgeb and sign in.</li>
      </ol>
      <form onSubmit={resend} className="authForm">
        <label>Registration email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" inputMode="email" /></label>
        <button className="button primary authSubmit" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Resend confirmation email'}</button>
        <p className="authStatus" role="status" aria-live="polite">{status}</p>
      </form>
      <Link className="button secondaryDark" href={`/auth/sign-in?next=${encodeURIComponent(nextPath)}`}>I confirmed my email — sign in</Link>
      <small>The confirmation link may expire. Use resend to receive a fresh one.</small>
    </div>
  );
}
