export const ETHIOPIAN_REGIONS = [
  'Addis Ababa',
  'Afar',
  'Amhara',
  'Benishangul-Gumuz',
  'Central Ethiopia',
  'Dire Dawa',
  'Gambella',
  'Harari',
  'Oromia',
  'Sidama',
  'Somali',
  'South Ethiopia',
  'South West Ethiopia Peoples’',
  'Tigray'
] as const;

export const ETHIOPIAN_ID_TYPES = [
  { value: 'fayda', label: 'Fayda National ID' },
  { value: 'passport', label: 'Ethiopian passport' },
  { value: 'origin_id', label: 'Ethiopian Origin ID' },
  { value: 'kebele', label: 'Kebele / resident ID' },
  { value: 'driver_license', label: 'Driver’s license' },
  { value: 'other', label: 'Other government-issued ID' }
] as const;

export type EthiopianIdType = (typeof ETHIOPIAN_ID_TYPES)[number]['value'];

export function normalizeEthiopianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  let local = digits;

  if (digits.startsWith('251')) local = digits.slice(3);
  if (local.startsWith('0')) local = local.slice(1);

  if (!/^[79]\d{8}$/.test(local)) return null;
  return `+251${local}`;
}

export function validateIdentityNumber(type: EthiopianIdType, value: string) {
  const compact = value.replace(/[\s-]/g, '').toUpperCase();

  if (type === 'fayda') {
    return /^\d{12}$/.test(compact)
      ? { valid: true as const, normalized: compact }
      : { valid: false as const, normalized: compact, message: 'Fayda ID must contain exactly 12 digits.' };
  }

  if (type === 'passport' || type === 'origin_id') {
    return /^[A-Z0-9]{6,15}$/.test(compact)
      ? { valid: true as const, normalized: compact }
      : { valid: false as const, normalized: compact, message: 'Enter 6–15 letters or numbers from the document.' };
  }

  const normalized = value.trim().toUpperCase();
  return /^[A-Z0-9/ -]{4,30}$/.test(normalized)
    ? { valid: true as const, normalized }
    : { valid: false as const, normalized, message: 'Enter 4–30 letters or numbers from the document.' };
}

export function identityLastFour(value: string) {
  return value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(-4);
}
