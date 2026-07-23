'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

function safeNextPath() {
  const value = new URLSearchParams(window.location.search).get('next');
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('passwordConfirmation') ?? '');
    const fullName = String(form.get('fullName') ?? '').trim();

    if (!email || password.length < 8) {
      setStatus('Enter a valid email and a password with at least 8 characters.');
      return;
    }

    if (mode === 'sign-up' && (!fullName || password !== confirmation)) {
      setStatus(!fullName ? 'Enter your full name.' : 'The two passwords do not match.');
      return;
    }

    setBusy(true);
    setStatus(mode === 'sign-in' ? 'Signing you in…' : 'Creating your secure account…');

    try {
      const supabase = createClient();

      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setStatus('Signed in successfully. Opening Mezgeb…');
        window.location.assign(safeNextPath());
        return;
      }

      const callback = new URL('/auth/callback', window.location.origin);
      callback.searchParams.set('next', '/dashboard');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callback.toString(),
          data: { full_name: fullName }
        }
      });

      if (error) throw error;
      if (data.session) {
        setStatus('Account created. Opening your workspace…');
        window.location.assign('/dashboard');
        return;
      }

      formElement.reset();
      window.location.assign(`/auth/check-email?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Authentication could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="authForm" onSubmit={submit} noValidate>
      {mode === 'sign-up' ? (
        <label>
          Full name
          <input name="fullName" required autoComplete="name" maxLength={80} />
        </label>
      ) : null}

      <label>
        Email address
        <input type="email" name="email" required autoComplete="email" inputMode="email" />
      </label>

      <label>
        Password
        <input
          type="password"
          name="password"
          minLength={8}
          required
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
        />
      </label>

      {mode === 'sign-up' ? (
        <label>
          Confirm password
          <input
            type="password"
            name="passwordConfirmation"
            minLength={8}
            required
            autoComplete="new-password"
          />
        </label>
      ) : null}

      {mode === 'sign-in' ? (
        <div className="authFormMeta">
          <span>Use the email you registered with.</span>
          <Link href="/auth/forgot-password">Forgot password?</Link>
        </div>
      ) : (
        <p className="authPolicyCopy">
          By creating an account, you agree to the <Link href="/terms">Terms</Link> and{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      )}

      <button className="button primary authSubmit" type="submit" disabled={busy}>
        {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in securely' : 'Create secure account'}
      </button>
      <p className="authStatus" role="status" aria-live="polite">{status}</p>
    </form>
  );
}
