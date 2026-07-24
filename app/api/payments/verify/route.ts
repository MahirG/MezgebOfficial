import { NextResponse } from 'next/server';
import { finalizeChapaPayment } from '@/lib/payment-verification';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const txRef = url.searchParams.get('tx_ref') || '';

  if (!/^MEZGEB-[A-Za-z0-9-]{12,100}$/.test(txRef)) {
    return NextResponse.json({ error: 'Invalid payment reference.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: 'Sign in to verify this payment.' }, { status: 401 });
  }

  const { data: intent, error: intentError } = await supabase
    .from('mezgeb_payment_intents')
    .select('status, amount_etb, currency, plan_code, billing_cycle')
    .eq('tx_ref', txRef)
    .maybeSingle();

  if (intentError) return NextResponse.json({ error: intentError.message }, { status: 400 });
  if (!intent) return NextResponse.json({ error: 'Payment reference not found.' }, { status: 404 });
  if (intent.status === 'paid') return NextResponse.json({ status: 'paid', intent });

  try {
    const result = await finalizeChapaPayment(txRef);
    return NextResponse.json({ ...result, intent });
  } catch (error) {
    return NextResponse.json({
      status: intent.status === 'failed' ? 'failed' : 'pending',
      intent,
      message: error instanceof Error ? error.message : 'Payment verification is still pending.'
    });
  }
}
