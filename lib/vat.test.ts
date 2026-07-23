import { describe, expect, it } from 'vitest';
import { calculateVat } from './vat';

describe('calculateVat', () => {
  it('calculates Ethiopian 15% VAT', () => {
    expect(calculateVat(100)).toEqual({ subtotal: 100, vat: 15, total: 115 });
  });
  it('rejects negative values', () => {
    expect(() => calculateVat(-1)).toThrow();
  });
});
