import { describe, expect, it } from 'vitest';
import { identityLastFour, normalizeEthiopianPhone, validateIdentityNumber } from './ethiopian-signup';

describe('Ethiopian signup validation', () => {
  it('normalizes common Ethiopian mobile formats', () => {
    expect(normalizeEthiopianPhone('0911 234 567')).toBe('+251911234567');
    expect(normalizeEthiopianPhone('+251 711 234 567')).toBe('+251711234567');
    expect(normalizeEthiopianPhone('911234567')).toBe('+251911234567');
  });

  it('rejects non-Ethiopian mobile formats', () => {
    expect(normalizeEthiopianPhone('011 123 4567')).toBeNull();
    expect(normalizeEthiopianPhone('12345')).toBeNull();
  });

  it('requires exactly twelve digits for Fayda', () => {
    expect(validateIdentityNumber('fayda', '1234 5678 9012')).toMatchObject({ valid: true, normalized: '123456789012' });
    expect(validateIdentityNumber('fayda', '123456')).toMatchObject({ valid: false });
  });

  it('keeps only the final four identity characters', () => {
    expect(identityLastFour('1234-5678-9012')).toBe('9012');
    expect(identityLastFour('EP-A123456')).toBe('3456');
  });
});
