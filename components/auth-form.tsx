'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const [status, setStatus] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    setStatus('Please wait…');
    try {
      const supabase = createClient();
      const result = mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
      if (result.error) throw result.error;
      setStatus(mode === 'sign-in' ? 'Signed in. Opening dashboard…' : 'Check your email to confirm your account.');
      if (mode === 'sign-in') location.assign('/dashboard');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Authentication is not configured yet.');
    }
  }
  return <form className="authForm" onSubmit={submit}><label>Email<input type="email" name="email" required autoComplete="email" /></label><label>Password<input type="password" name="password" minLength={8} required autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} /></label><button className="button primary" type="submit">{mode === 'sign-in' ? 'Sign in' : 'Create account'}</button><p role="status">{status}</p></form>;
}
