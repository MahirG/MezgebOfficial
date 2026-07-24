import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { finalizeChapaPayment } from '@/lib/payment-verification';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left, 'utf8');
  const b = Buffer.from(right, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

function validSignature(rawBody: string, request: Request, secret: string) {
  const signatures = [
    request.headers.get('x-chapa-signature'),
    request.headers.get('chapa-signature')
  ].filter((value): value is string => Boolean(value));

  if (!signatures.length) return false;

  const bodyDigest = createHmac('sha256', secret).update(rawBody).digest('hex');
  const secretDigest = createHmac('sha256', secret).update(secret).digest('hex');
  return signatures.some((signature) => safeEqual(signature, bodyDigest) || safeEqual(signature, secretDigest));
}

function readReference(payload: Record<string, unknown>) {
  const data = payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
    ? payload.data as Record<string, unknown>
    : {};
  return String(payload.tx_ref || data.tx_ref || '');
}

export async function POST(request: Request) {
  const secret = process.env.CHAPA_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: 'Webhook verification is not configured.' }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!validSignature(rawBody, request, secret)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const txRef = readReference(payload);

  if (!/^MEZGEB-[A-Za-z0-9-]{12,100}$/.test(txRef)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    const result = await finalizeChapaPayment(txRef);
    return NextResponse.json({ received: true, status: result.status });
  } catch (error) {
    return NextResponse.json(
      {
        received: true,
        status: 'verification_failed',
        error: error instanceof Error ? error.message : 'Payment verification failed.'
      },
      { status: 202 }
    );
  }
}
