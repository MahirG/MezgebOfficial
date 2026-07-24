import type { PaymentMethodCode } from '@/lib/payment-methods';

const chapaApiBase = 'https://api.chapa.co/v1';

type JsonRecord = Record<string, unknown>;

export type ChapaVerifiedTransaction = {
  txRef: string;
  providerReference: string | null;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  payload: JsonRecord;
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function asNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getSecretKey() {
  return process.env.CHAPA_SECRET_KEY?.trim() ?? '';
}

export function isChapaConfigured() {
  return Boolean(getSecretKey());
}

export async function initializeChapaPayment(input: {
  amount: number;
  txRef: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  paymentMethod: PaymentMethodCode;
  callbackUrl: string;
  returnUrl: string;
  planCode: string;
  billingCycle: 'monthly' | 'annual';
}) {
  const secretKey = getSecretKey();
  if (!secretKey) throw new Error('Secure payment processing is not configured yet.');

  const response = await fetch(`${chapaApiBase}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: input.amount.toFixed(2),
      currency: 'ETB',
      email: input.email || undefined,
      first_name: input.firstName || 'Mezgeb',
      last_name: input.lastName || 'Customer',
      phone_number: input.phoneNumber || undefined,
      tx_ref: input.txRef,
      callback_url: input.callbackUrl,
      return_url: input.returnUrl,
      customization: {
        title: 'Mezgeb subscription',
        description: `${input.planCode} · ${input.billingCycle}`
      },
      meta: {
        plan_code: input.planCode,
        billing_cycle: input.billingCycle,
        preferred_payment_method: input.paymentMethod
      }
    }),
    cache: 'no-store'
  });

  const payload = asRecord(await response.json().catch(() => ({})));
  const data = asRecord(payload.data);
  const checkoutUrl = asString(data.checkout_url);
  const providerReference = asString(data.reference) || null;

  if (!response.ok || !checkoutUrl) {
    const message = asString(payload.message) || 'The secure checkout could not be started.';
    throw new Error(message);
  }

  return { checkoutUrl, providerReference, payload };
}

export async function verifyChapaTransaction(txRef: string): Promise<ChapaVerifiedTransaction> {
  const secretKey = getSecretKey();
  if (!secretKey) throw new Error('Secure payment verification is not configured yet.');

  const response = await fetch(`${chapaApiBase}/transaction/verify/${encodeURIComponent(txRef)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: 'no-store'
  });

  const payload = asRecord(await response.json().catch(() => ({})));
  const data = asRecord(payload.data);

  if (!response.ok) {
    throw new Error(asString(payload.message) || 'The payment could not be verified.');
  }

  return {
    txRef: asString(data.tx_ref) || txRef,
    providerReference: asString(data.reference) || asString(data.ref_id) || null,
    status: asString(data.status || payload.status).toLowerCase(),
    amount: asNumber(data.amount),
    currency: (asString(data.currency) || 'ETB').toUpperCase(),
    paymentMethod: asString(data.payment_method) || null,
    payload
  };
}
