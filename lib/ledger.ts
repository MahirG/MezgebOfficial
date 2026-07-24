export type LedgerTransactionLike = {
  type: string;
  amount: number;
  vatAmount: number;
};

export type CustomerBalanceLike = {
  balance: number;
  earliestDueAt?: string | null;
};

export function calculateInclusiveVat(amount: number, rate = 0.15) {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(rate) || rate < 0) return 0;
  return amount * rate / (1 + rate);
}

export function calculateLedgerTotals(
  transactions: LedgerTransactionLike[],
  customers: CustomerBalanceLike[] = []
) {
  let sales = 0;
  let expenses = 0;
  let outputVat = 0;
  let inputVat = 0;

  for (const item of transactions) {
    if (item.type === 'sale' || item.type === 'credit_sale') {
      sales += item.amount;
      outputVat += item.vatAmount;
    } else if (item.type === 'expense' || item.type === 'supplier_purchase') {
      expenses += item.amount;
      inputVat += item.vatAmount;
    } else if (item.type === 'adjustment') {
      sales += item.amount;
    }
  }

  return {
    sales,
    expenses,
    balance: sales - expenses,
    outputVat,
    inputVat,
    vatPayable: Math.max(0, outputVat - inputVat),
    dube: customers.reduce((sum, customer) => sum + Math.max(0, customer.balance), 0)
  };
}

export function isCustomerOverdue(customer: CustomerBalanceLike, now = Date.now()) {
  if (customer.balance <= 0 || !customer.earliestDueAt) return false;
  const due = new Date(customer.earliestDueAt).getTime();
  return Number.isFinite(due) && due < now;
}
