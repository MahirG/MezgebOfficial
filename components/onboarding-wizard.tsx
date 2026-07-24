'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ETHIOPIAN_REGIONS } from '@/lib/ethiopian-registration';
import { createClient } from '@/lib/supabase/client';

const BUSINESS_TYPES = [
  ['cafe_restaurant', 'Café or restaurant'],
  ['retail', 'Retail shop'],
  ['wholesale', 'Wholesale or distribution'],
  ['service', 'Service business'],
  ['manufacturing', 'Manufacturing'],
  ['agriculture', 'Agriculture'],
  ['transport', 'Transport or logistics'],
  ['professional', 'Professional practice'],
  ['other', 'Other business']
] as const;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type FormState = {
  name: string;
  businessType: string;
  region: string;
  city: string;
  phone: string;
  tin: string;
  vatRegistered: boolean;
  openingBalance: string;
  fiscalMonth: string;
  receiptPrefix: string;
};

const initialState: FormState = {
  name: '',
  businessType: 'retail',
  region: 'Addis Ababa',
  city: '',
  phone: '',
  tin: '',
  vatRegistered: false,
  openingBalance: '0',
  fiscalMonth: '1',
  receiptPrefix: 'R'
};

export function OnboardingWizard({ email }: { email: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedBusinessType = useMemo(
    () => BUSINESS_TYPES.find(([value]) => value === form.businessType)?.[1] ?? 'Business',
    [form.businessType]
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function next() {
    setStatus('');
    if (step === 1) {
      if (form.name.trim().length < 2) {
        setStatus('Enter a business name with at least two characters.');
        return;
      }
      if (!form.city.trim()) {
        setStatus('Enter your city, sub-city, zone, or woreda.');
        return;
      }
    }
    if (step === 2) {
      const opening = Number(form.openingBalance);
      if (!Number.isFinite(opening) || opening < 0) {
        setStatus('Opening cash balance must be zero or a positive amount.');
        return;
      }
      if (!/^[A-Za-z0-9-]{1,10}$/.test(form.receiptPrefix.trim())) {
        setStatus('Receipt prefix can contain letters, numbers and hyphens only.');
        return;
      }
    }
    setStep((current) => Math.min(3, current + 1));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setStatus('Creating your secure Mezgeb workspace…');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('mezgeb_complete_onboarding', {
        p_name: form.name.trim(),
        p_business_type: form.businessType,
        p_region: form.region,
        p_city: form.city.trim(),
        p_phone: form.phone.trim() || null,
        p_tin: form.tin.trim() || null,
        p_vat_registered: form.vatRegistered,
        p_opening_balance: Number(form.openingBalance || 0),
        p_fiscal_year_start_month: Number(form.fiscalMonth),
        p_receipt_prefix: form.receiptPrefix.trim().toUpperCase()
      });
      if (error) throw error;
      if (!data) throw new Error('The business workspace was not created.');

      setStatus('Workspace created. Opening your live ledger…');
      router.push(`/app?business=${encodeURIComponent(String(data))}&tour=1`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The business workspace could not be created.');
      setBusy(false);
    }
  }

  return (
    <section className="onboardingCard" aria-label="Business onboarding">
      <header className="onboardingCardHeader">
        <div>
          <small>Step {step} of 3</small>
          <h2>{step === 1 ? 'Tell us about the business' : step === 2 ? 'Set the financial starting point' : 'Review and create'}</h2>
        </div>
        <span>{email}</span>
      </header>

      <div className="onboardingProgress" aria-label={`Step ${step} of 3`}>
        {[1, 2, 3].map((item) => <i className={item <= step ? 'active' : ''} key={item} />)}
      </div>

      <form onSubmit={submit}>
        {step === 1 ? (
          <div className="onboardingFields">
            <label className="wide">Business name<input autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} maxLength={120} placeholder="Abebe's Café" /></label>
            <label>Business type<select value={form.businessType} onChange={(event) => update('businessType', event.target.value)}>{BUSINESS_TYPES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Region / city administration<select value={form.region} onChange={(event) => update('region', event.target.value)}>{ETHIOPIAN_REGIONS.map((region) => <option value={region} key={region}>{region}</option>)}</select></label>
            <label>City, sub-city, zone, or woreda<input value={form.city} onChange={(event) => update('city', event.target.value)} maxLength={100} placeholder="Bole" /></label>
            <label>Business phone <span>Optional</span><input value={form.phone} onChange={(event) => update('phone', event.target.value)} inputMode="tel" autoComplete="tel" placeholder="+251…" /></label>
            <label>TIN <span>Optional</span><input value={form.tin} onChange={(event) => update('tin', event.target.value)} inputMode="numeric" placeholder="Tax identification number" /></label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="onboardingFields">
            <label className="wide">Opening cash balance in ETB<input value={form.openingBalance} onChange={(event) => update('openingBalance', event.target.value)} inputMode="decimal" placeholder="0.00" /><small>This creates the first protected ledger adjustment.</small></label>
            <label>Fiscal year starts<select value={form.fiscalMonth} onChange={(event) => update('fiscalMonth', event.target.value)}>{MONTHS.map((month, index) => <option value={String(index + 1)} key={month}>{month}</option>)}</select></label>
            <label>Receipt prefix<input value={form.receiptPrefix} onChange={(event) => update('receiptPrefix', event.target.value.toUpperCase())} maxLength={10} placeholder="R" /></label>
            <label className="wide onboardingCheck"><input type="checkbox" checked={form.vatRegistered} onChange={(event) => update('vatRegistered', event.target.checked)} /><span><b>VAT-registered business</b><small>Use 15% VAT calculations and VAT-ready receipt totals.</small></span></label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="onboardingReview">
            <article><small>Business</small><strong>{form.name}</strong><span>{selectedBusinessType}</span></article>
            <article><small>Location</small><strong>{form.city}</strong><span>{form.region}</span></article>
            <article><small>Opening balance</small><strong>ETB {Number(form.openingBalance || 0).toLocaleString('en-US')}</strong><span>Stored as your first ledger record</span></article>
            <article><small>Receipts</small><strong>{form.receiptPrefix.toUpperCase()}-0001</strong><span>{form.vatRegistered ? 'VAT calculations enabled' : 'Standard receipt setup'}</span></article>
            <p>Your account owns this workspace. Supabase Row Level Security prevents other users from reading or changing its business records.</p>
          </div>
        ) : null}

        <p className="onboardingStatus" role="status" aria-live="polite">{status}</p>
        <footer className="onboardingActions">
          {step > 1 ? <button type="button" className="button" onClick={() => { setStep((current) => current - 1); setStatus(''); }} disabled={busy}>Back</button> : <span />}
          {step < 3 ? <button type="button" className="button primary" onClick={next}>Continue</button> : <button type="submit" className="button primary" disabled={busy}>{busy ? 'Creating workspace…' : 'Create secure workspace'}</button>}
        </footer>
      </form>
    </section>
  );
}
