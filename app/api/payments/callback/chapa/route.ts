import { NextResponse } from 'next/server';
import { finalizeChapaPayment } from '@/lib/payment-verification';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function validReference(value: string) {
  return /^MEZGEB-[A-Za-z0-9-]{12,100}$/.test(value);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const txRef = url.searchParams.get('tx_ref') || '';

  if (!validReference(txRef)) {
    return NextResponse.redirect(new URL('/payment/return?status=invalid', url.origin));
  }

  try {
    const result = await finalizeChapaPayment(txRef);
    return NextResponse.redirect(new URL(`/payment/return?tx_ref=${encodeURIComponent(txRef)}&status=${result.status}`, url.origin));
  } catch {
    return NextResponse.redirect(new URL(`/payment/return?tx_ref=${encodeURIComponent(txRef)}&status=pending`, url.origin));
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const payload = await request.json().catch(() => ({})) as Record<string, unknown>;
  const txRef = String(payload.tx_ref || url.searchParams.get('tx_ref') || '');

  if (!validReference(txRef)) {
    return NextResponse.json({ error: 'Invalid payment reference.' }, { status: 400 });
  }

  try {
    const result = await finalizeChapaPayment(txRef);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment verification failed.' },
      { status: 400 }
    );
  }
}
