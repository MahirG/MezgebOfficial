import { describe, expect, it } from 'vitest';
import { calculateInclusiveVat, calculateLedgerTotals, isCustomerOverdue } from './ledger';

describe('production ledger calculations', () => {
  it('calculates VAT from a VAT-inclusive amount', () => {
    expect(calculateInclusiveVat(115)).toBeCloseTo(15, 8);
    expect(calculateInclusiveVat(0)).toBe(0);
  });

  it('separates sales, expenses, VAT and Dube balances', () => {
    const totals = calculateLedgerTotals([
      { type: 'sale', amount: 1150, vatAmount: 150 },
      { type: 'credit_sale', amount: 575, vatAmount: 75 },
      { type: 'expense', amount: 460, vatAmount: 60 },
      { type: 'adjustment', amount: 1000, vatAmount: 0 },
      { type: 'credit_payment', amount: 200, vatAmount: 0 }
    ], [
      { balance: 375 },
      { balance: -20 },
      { balance: 100 }
    ]);

    expect(totals.sales).toBe(2725);
    expect(totals.expenses).toBe(460);
    expect(totals.balance).toBe(2265);
    expect(totals.outputVat).toBe(225);
    expect(totals.inputVat).toBe(60);
    expect(totals.vatPayable).toBe(165);
    expect(totals.dube).toBe(475);
  });

  it('marks only positive past-due balances as overdue', () => {
    const now = new Date('2026-07-24T12:00:00Z').getTime();
    expect(isCustomerOverdue({ balance: 100, earliestDueAt: '2026-07-23T12:00:00Z' }, now)).toBe(true);
    expect(isCustomerOverdue({ balance: 100, earliestDueAt: '2026-07-25T12:00:00Z' }, now)).toBe(false);
    expect(isCustomerOverdue({ balance: 0, earliestDueAt: '2026-07-23T12:00:00Z' }, now)).toBe(false);
  });
});
