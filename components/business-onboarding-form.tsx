'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function BusinessOnboardingForm() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    const businessName = String(form.get('businessName') ?? '').trim();
    if (businessName.length < 2) {
      setStatus('Enter your business name.');
      return;
    }

    setBusy(true);
    setStatus('Creating your protected business workspace…');

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error('Your session has expired. Sign in again.');

      const { data: business, error: businessError } = await supabase
        .from('mezgeb_businesses')
        .insert({
          owner_id: userData.user.id,
          name: businessName,
          city: String(form.get('city') ?? '').trim() || null,
          phone: String(form.get('phone') ?? '').trim() || null,
          tin: String(form.get('tin') ?? '').trim() || null,
          vat_registered: form.get('vatRegistered') === 'on'
        })
        .select('id')
        .single();

      if (businessError) throw businessError;

      const { error: profileError } = await supabase
        .from('mezgeb_profiles')
        .update({ last_business_id: business.id })
        .eq('id', userData.user.id);

      if (profileError) throw profileError;

      setStatus('Business created successfully. Loading your workspace…');
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The business could not be created.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="businessOnboardingForm" onSubmit={submit}>
      <div className="dashboardFormGrid">
        <label>
          Business name
          <input name="businessName" required maxLength={120} placeholder="Abebe's Cafe" />
        </label>
        <label>
          City
          <input name="city" maxLength={80} placeholder="Addis Ababa" />
        </label>
        <label>
          Phone
          <input name="phone" inputMode="tel" autoComplete="tel" placeholder="+251…" />
        </label>
        <label>
          TIN <span>Optional</span>
          <input name="tin" inputMode="numeric" placeholder="Tax identification number" />
        </label>
      </div>
      <label className="dashboardCheckbox">
        <input type="checkbox" name="vatRegistered" />
        <span><strong>VAT registered</strong><small>Enable 15% VAT-ready records and receipts.</small></span>
      </label>
      <button className="button primary" type="submit" disabled={busy}>
        {busy ? 'Creating workspace…' : 'Create my Mezgeb business'}
      </button>
      <p role="status" aria-live="polite">{status}</p>
    </form>
  );
}
