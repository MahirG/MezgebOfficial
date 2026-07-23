export const ETHIOPIAN_VAT_RATE = 0.15;

export function calculateVat(subtotal: number, rate = ETHIOPIAN_VAT_RATE) {
  if (!Number.isFinite(subtotal) || subtotal < 0) throw new Error('Subtotal must be positive.');
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error('Invalid VAT rate.');
  const vat = Math.round(subtotal * rate * 100) / 100;
  return { subtotal, vat, total: Math.round((subtotal + vat) * 100) / 100 };
}

export function formatEtb(value: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2
  }).format(value);
}
