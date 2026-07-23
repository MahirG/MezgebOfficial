'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function UpdatePasswordForm() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmation') ?? '');

    if (password.length < 8) {
      setStatus('Use at least 8 characters for your new password.');
      return;
    }
    if (password !== confirmation) {
      setStatus('The two passwords do not match.');
      return;
    }

    setBusy(true);
    setStatus('Updating your password…');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus('Password updated successfully. Opening your dashboard…');
      window.setTimeout(() => window.location.assign('/dashboard'), 700);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Your password could not be updated.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="authForm" onSubmit={submit}>
      <label>
        New password
        <input type="password" name="password" minLength={8} required autoComplete="new-password" />
      </label>
      <label>
        Confirm new password
        <input type="password" name="confirmation" minLength={8} required autoComplete="new-password" />
      </label>
      <button className="button primary authSubmit" type="submit" disabled={busy}>
        {busy ? 'Please wait…' : 'Update password'}
      </button>
      <p className="authStatus" role="status" aria-live="polite">{status}</p>
    </form>
  );
}
