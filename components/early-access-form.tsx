'use client';

import { FormEvent, useState } from 'react';

export function EarlyAccessForm() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    setBusy(true);
    setStatus('Joining the Mezgeb update list…');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json() as { demo?: boolean; message?: string };
      if (result.demo) localStorage.setItem('mezgeb-waitlist-demo', JSON.stringify(payload));
      if (!response.ok) throw new Error(result.message || 'Your request could not be submitted.');
      setStatus(result.message ?? 'You are on the Mezgeb product-update list.');
      formElement.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Your request could not be submitted.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="accessForm" onSubmit={submit}>
      <label>Name<input required name="name" autoComplete="name" /></label>
      <label>Email or phone<input required name="contact" autoComplete="email" /></label>
      <label>Business type<select name="businessType"><option>Café or restaurant</option><option>Retail shop</option><option>Service business</option><option>Distributor</option><option>Other</option></select></label>
      <label>City<input name="city" defaultValue="Addis Ababa" /></label>
      <label className="consent"><input type="checkbox" required name="consent" /> I agree to receive Mezgeb product and launch updates.</label>
      <button className="button primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Join product updates'}</button>
      <p role="status" aria-live="polite">{status}</p>
    </form>
  );
}
