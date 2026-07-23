'use client';

import { FormEvent, useState } from 'react';

export function EarlyAccessForm() {
  const [status, setStatus] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Submitting…');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (result.demo) localStorage.setItem('mezgeb-waitlist-demo', JSON.stringify(payload));
    setStatus(result.message ?? 'Thank you. Your request was received.');
    if (response.ok) event.currentTarget.reset();
  }
  return (
    <form className="accessForm" onSubmit={submit}>
      <label>Name<input required name="name" autoComplete="name" /></label>
      <label>Email or phone<input required name="contact" autoComplete="email" /></label>
      <label>Business type<select name="businessType"><option>Café or restaurant</option><option>Retail shop</option><option>Service business</option><option>Distributor</option><option>Other</option></select></label>
      <label>City<input name="city" defaultValue="Addis Ababa" /></label>
      <label className="consent"><input type="checkbox" required name="consent" /> I agree to be contacted about Mezgeb early access.</label>
      <button className="button primary" type="submit">Request early access</button>
      <p role="status" aria-live="polite">{status}</p>
    </form>
  );
}
