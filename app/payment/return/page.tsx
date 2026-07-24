import { PaymentReturnClient } from './payment-return-client';

export default async function PaymentReturnPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const txRef = typeof params.tx_ref === 'string' ? params.tx_ref : '';
  const initialStatus = typeof params.status === 'string' ? params.status : '';

  return <PaymentReturnClient txRef={txRef} initialStatus={initialStatus} />;
}
