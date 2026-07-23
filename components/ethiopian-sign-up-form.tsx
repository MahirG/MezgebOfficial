'use client';

import Link from 'next/link';
import { FormEvent, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  ETHIOPIAN_ID_TYPES,
  ETHIOPIAN_REGIONS,
  type EthiopianIdType,
  identityLastFour,
  normalizeEthiopianPhone,
  validateIdentityNumber
} from '@/lib/ethiopian-signup';

function safeNextPath() {
  const value = new URLSearchParams(window.location.search).get('next');
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

function formText(form: FormData, name: string) {
  return String(form.get(name) ?? '').trim();
}

export function EthiopianSignUpForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [idType, setIdType] = useState<EthiopianIdType>('fayda');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  function continueToSecurity() {
    if (!formRef.current) return;
    const form = new FormData(formRef.current);
    const fullName = formText(form, 'fullName');
    const email = formText(form, 'email').toLowerCase();
    const phone = normalizeEthiopianPhone(formText(form, 'phone'));
    const region = formText(form, 'region');
    const cityWoreda = formText(form, 'cityWoreda');

    if (fullName.length < 3) return setStatus('Enter your full legal name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setStatus('Enter a valid email address.');
    if (!phone) return setStatus('Enter a valid Ethiopian mobile number, such as 0911 234 567.');
    if (!region) return setStatus('Select your region or city administration.');
    if (cityWoreda.length < 2) return setStatus('Enter your city, sub-city, zone, or woreda.');

    setStatus('');
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const fullName = formText(form, 'fullName');
    const email = formText(form, 'email').toLowerCase();
    const phone = normalizeEthiopianPhone(formText(form, 'phone'));
    const region = formText(form, 'region');
    const cityWoreda = formText(form, 'cityWoreda');
    const preferredLanguage = formText(form, 'preferredLanguage');
    const accountRole = formText(form, 'accountRole');
    const identityNumber = formText(form, 'identityNumber');
    const password = String(form.get('password') ?? '');
    const passwordConfirmation = String(form.get('passwordConfirmation') ?? '');
    const termsAccepted = form.get('termsAccepted') === 'on';
    const identityConsent = form.get('identityConsent') === 'on';
    const identity = validateIdentityNumber(idType, identityNumber);

    if (!phone) return setStatus('Enter a valid Ethiopian mobile number.');
    if (!identity.valid) return setStatus(identity.message);
    if (password.length < 8) return setStatus('Use a password with at least 8 characters.');
    if (password !== passwordConfirmation) return setStatus('The two passwords do not match.');
    if (!termsAccepted || !identityConsent) {
      return setStatus('Accept the terms and the limited identity-data notice to continue.');
    }

    setBusy(true);
    setStatus('Creating your secure Mezgeb account…');

    try {
      const nextPath = safeNextPath();
      const callback = new URL('/auth/callback', window.location.origin);
      callback.searchParams.set('next', nextPath);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callback.toString(),
          data: {
            full_name: fullName,
            phone,
            region,
            city_woreda: cityWoreda,
            preferred_language: preferredLanguage,
            account_role: accountRole,
            id_type: idType,
            id_last4: identityLastFour(identity.normalized),
            terms_accepted: 'true',
            identity_consent: 'true'
          }
        }
      });

      if (error) throw error;
      if (data.session) {
        window.location.assign(nextPath);
        return;
      }

      formElement.reset();
      const checkEmail = new URL('/auth/check-email', window.location.origin);
      checkEmail.searchParams.set('email', email);
      checkEmail.searchParams.set('next', nextPath);
      window.location.assign(`${checkEmail.pathname}${checkEmail.search}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Registration could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} className="authForm ethiopianSignup" onSubmit={submit} noValidate>
      <div className="signupProgress" aria-label={`Registration step ${step} of 2`}>
        <span className="active">1 <b>About you</b></span>
        <i aria-hidden="true" />
        <span className={step === 2 ? 'active' : ''}>2 <b>Security</b></span>
      </div>

      <fieldset hidden={step !== 1}>
        <legend>Personal and contact information</legend>
        <div className="authGrid">
          <label>Full legal name<input name="fullName" required autoComplete="name" maxLength={80} placeholder="Mahir Aman" /></label>
          <label>Ethiopian mobile number<input name="phone" required autoComplete="tel" inputMode="tel" placeholder="0911 234 567" /></label>
          <label className="fullSpan">Email address<input type="email" name="email" required autoComplete="email" inputMode="email" placeholder="name@example.com" /></label>
          <label>Region / city administration<select name="region" required defaultValue=""><option value="" disabled>Select location</option>{ETHIOPIAN_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}</select></label>
          <label>City, sub-city, zone, or woreda<input name="cityWoreda" required maxLength={100} placeholder="Bole, Addis Ababa" /></label>
          <label>Preferred language<select name="preferredLanguage" defaultValue="en"><option value="en">English</option><option value="am">Amharic — አማርኛ</option><option value="om">Afaan Oromo</option><option value="ti">Tigrinya — ትግርኛ</option></select></label>
          <label>Your role<select name="accountRole" defaultValue="owner"><option value="owner">Business owner</option><option value="manager">Manager</option><option value="accountant">Accountant / bookkeeper</option><option value="employee">Employee</option></select></label>
        </div>
        <button className="button primary authSubmit" type="button" onClick={continueToSecurity}>Continue to security</button>
      </fieldset>

      <fieldset hidden={step !== 2}>
        <legend>Identity and account security</legend>
        <div className="identityNotice"><strong>Limited identity record</strong><span>Mezgeb stores the ID type and only the final four characters. The complete document number is not stored until an approved verification service is connected.</span></div>
        <div className="authGrid">
          <label>Ethiopian ID type<select name="idType" value={idType} onChange={(event) => setIdType(event.target.value as EthiopianIdType)}>{ETHIOPIAN_ID_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
          <label>{idType === 'fayda' ? '12-digit Fayda number' : 'Document number'}<input name="identityNumber" required inputMode={idType === 'fayda' ? 'numeric' : 'text'} autoComplete="off" maxLength={30} placeholder={idType === 'fayda' ? '0000 0000 0000' : 'Enter document number'} /></label>
          <label>Password<input type="password" name="password" minLength={8} required autoComplete="new-password" /></label>
          <label>Confirm password<input type="password" name="passwordConfirmation" minLength={8} required autoComplete="new-password" /></label>
        </div>
        <label className="authConsent"><input type="checkbox" name="termsAccepted" required /><span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</span></label>
        <label className="authConsent"><input type="checkbox" name="identityConsent" required /><span>I understand that my ID type and final four characters are retained for account-security purposes, while the full number is discarded.</span></label>
        <div className="signupActions"><button className="button textButton" type="button" onClick={() => setStep(1)}>← Back</button><button className="button primary authSubmit" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Register and confirm email'}</button></div>
      </fieldset>

      <p className="authStatus" role="status" aria-live="polite">{status}</p>
    </form>
  );
}
