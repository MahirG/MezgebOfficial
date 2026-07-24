import { verifyChapaTransaction } from '@/lib/chapa';
import { createAdminClient } from '@/lib/supabase/admin';

type PaymentIntentRow = {
  tx_ref: string;
  amount_etb: number | string;
  currency: string;
  status: string;
};

export async function finalizeChapaPayment(txRef: string) {
  const admin = createAdminClient();
  const { data: intent, error: intentError } = await admin
    .from('mezgeb_payment_intents')
    .select('tx_ref, amount_etb, currency, status')
    .eq('tx_ref', txRef)
    .maybeSingle<PaymentIntentRow>();

  if (intentError) throw new Error(intentError.message);
  if (!intent) throw new Error('Unknown Mezgeb payment reference.');
  if (intent.status === 'paid') return { status: 'paid' as const, txRef };

  const verified = await verifyChapaTransaction(txRef);
  const expectedAmount = Number(intent.amount_etb);

  if (verified.txRef !== txRef) throw new Error('The provider returned a different payment reference.');
  if (verified.currency !== String(intent.currency).toUpperCase()) throw new Error('Payment currency mismatch.');
  if (Math.abs(verified.amount - expectedAmount) > 0.009) throw new Error('Payment amount mismatch.');

  const { data, error } = await admin.rpc('mezgeb_finalize_verified_payment', {
    p_tx_ref: txRef,
    p_provider_reference: verified.providerReference ?? '',
    p_amount: verified.amount,
    p_currency: verified.currency,
    p_status: verified.status,
    p_payload: verified.payload
  });

  if (error) throw new Error(error.message);
  const finalized = data as { status?: string } | null;

  return {
    status: finalized?.status === 'paid' ? 'paid' as const : 'pending' as const,
    txRef,
    providerStatus: verified.status
  };
}
