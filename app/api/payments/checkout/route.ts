import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { initializeChapaPayment, isChapaConfigured } from '@/lib/chapa';
import { isPaymentMethodCode } from '@/lib/payment-methods';
import { createClient } from '@/lib/supabase/server';

const supportedCycles = new Set(['monthly', 'annual']);
const planCodePattern = /^[a-z0-9_-]{2,40}$/;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || new URL(request.url).origin).replace(/\/$/, '');
}

function splitName(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (!normalized) return { firstName: 'Mezgeb', lastName: 'Customer' };
  const [firstName, ...rest] = normalized.split(' ');
  return { firstName, lastName: rest.join(' ') || 'Customer' };
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid checkout request.' }, { status: 400 });
  }

  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const planCode = typeof input.planCode === 'string' ? input.planCode : '';
  const billingCycle = typeof input.billingCycle === 'string' ? input.billingCycle : '';
  const paymentMethod = input.paymentMethod;
  const idempotencyKey = typeof input.idempotencyKey === 'string' ? input.idempotencyKey : '';

  if (!planCodePattern.test(planCode) || !supportedCycles.has(billingCycle) || !isPaymentMethodCode(paymentMethod)) {
    return NextResponse.json({ error: 'Choose a valid plan, billing interval and payment method.' }, { status: 400 });
  }

  if (idempotencyKey.length < 16 || idempotencyKey.length > 120) {
    return NextResponse.json({ error: 'Invalid checkout session.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Create or sign in to your Mezgeb account before paying.' }, { status: 401 });
  }

  if (!isChapaConfigured()) {
    return NextResponse.json(
      {
        error: 'Secure online payment is engineered but the Chapa merchant secret has not been connected yet.',
        code: 'PAYMENTS_NOT_CONFIGURED'
      },
      { status: 503 }
    );
  }

  const txRef = `MEZGEB-${Date.now().toString(36)}-${randomUUID().replaceAll('-', '').slice(0, 22)}`;
  const { data: intentData, error: intentError } = await supabase.rpc('mezgeb_create_payment_intent', {
    p_plan_code: planCode,
    p_billing_cycle: billingCycle,
    p_payment_method: paymentMethod,
    p_tx_ref: txRef,
    p_idempotency_key: idempotencyKey
  });

  if (intentError) {
    return NextResponse.json({ error: intentError.message }, { status: 400 });
  }

  const intent = intentData as {
    tx_ref?: string;
    amount_etb?: number | string;
    plan_code?: string;
    billing_cycle?: 'monthly' | 'annual';
  } | null;
  const resolvedTxRef = String(intent?.tx_ref || txRef);
  const amount = Number(intent?.amount_etb ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'The selected plan does not have a valid ETB amount.' }, { status: 400 });
  }

  const metadata = userData.user.user_metadata && typeof userData.user.user_metadata === 'object'
    ? userData.user.user_metadata as Record<string, unknown>
    : {};
  const { firstName, lastName } = splitName(metadata.full_name || metadata.name);
  const phoneNumber = typeof metadata.phone === 'string'
    ? metadata.phone
    : userData.user.phone || '';
  const origin = getOrigin(request);

  try {
    const checkout = await initializeChapaPayment({
      amount,
      txRef: resolvedTxRef,
      email: userData.user.email || '',
      firstName,
      lastName,
      phoneNumber,
      paymentMethod,
      callbackUrl: `${origin}/api/payments/callback/chapa?tx_ref=${encodeURIComponent(resolvedTxRef)}`,
      returnUrl: `${origin}/payment/return?tx_ref=${encodeURIComponent(resolvedTxRef)}`,
      planCode: String(intent?.plan_code || planCode),
      billingCycle: intent?.billing_cycle === 'annual' ? 'annual' : 'monthly'
    });

    const { error: attachError } = await supabase.rpc('mezgeb_attach_payment_checkout', {
      p_tx_ref: resolvedTxRef,
      p_checkout_url: checkout.checkoutUrl,
      p_provider_reference: checkout.providerReference ?? '',
      p_payload: checkout.payload
    });

    if (attachError) throw new Error(attachError.message);

    return NextResponse.json({
      checkoutUrl: checkout.checkoutUrl,
      txRef: resolvedTxRef,
      amountEtb: amount,
      currency: 'ETB'
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'The secure checkout could not be started.';
    await supabase.rpc('mezgeb_mark_payment_failed', {
      p_tx_ref: resolvedTxRef,
      p_reason: reason
    });

    return NextResponse.json({ error: reason }, { status: 502 });
  }
}
