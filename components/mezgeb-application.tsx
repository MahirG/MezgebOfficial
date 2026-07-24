'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type View = 'dashboard' | 'ledger' | 'receipts' | 'dube' | 'reports' | 'operations';
type EntryMode = 'sale' | 'expense';
type DubeMode = 'credit_sale' | 'credit_payment';

type Business = {
  id: string;
  name: string;
  businessType: string | null;
  region: string | null;
  city: string | null;
  phone: string | null;
  tin: string | null;
  vatRegistered: boolean;
  openingBalance: number;
  receiptPrefix: string;
};

type Transaction = {
  id: string;
  businessId: string;
  customerId: string | null;
  customerName: string | null;
  type: string;
  description: string;
  amount: number;
  vatAmount: number;
  paymentMethod: string;
  occurredAt: string;
  category: string | null;
  reference: string | null;
  notes: string | null;
  dueAt: string | null;
};

type Customer = {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  notes: string | null;
  creditLimit: number;
  balance: number;
  lastActivityAt: string | null;
  earliestDueAt: string | null;
};

type Receipt = {
  id: string;
  transaction_id: string | null;
  receipt_number: string;
  total: number;
  issued_at: string;
  status: string;
};

type Props = {
  userId: string;
  userName: string;
  businesses: Business[];
  activeBusinessId: string;
  initialTransactions: Transaction[];
  initialCustomers: Customer[];
  initialTourStep: number;
  forceTour: boolean;
};

type CustomerRelation = { name: string } | Array<{ name: string }> | null;

const navigation: Array<{ id: View; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'ledger', label: 'Ledger', icon: '↕' },
  { id: 'receipts', label: 'Receipts', icon: '▤' },
  { id: 'dube', label: 'Dube', icon: '◎' },
  { id: 'reports', label: 'Reports', icon: '⌁' },
  { id: 'operations', label: 'Operations', icon: '◇' }
];

const money = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat('en-ET', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

function formatMoney(value: number) {
  return `ETB ${money.format(value)}`;
}

function paymentLabel(value: string) {
  const labels: Record<string, string> = {
    cash: 'Cash',
    telebirr: 'Telebirr',
    mpesa: 'M-Pesa',
    cbe_birr: 'CBE Birr',
    bank: 'Bank',
    dube: 'Dube',
    other: 'Other'
  };
  return labels[value] ?? value;
}

function customerName(relation: CustomerRelation) {
  return Array.isArray(relation) ? relation[0]?.name ?? null : relation?.name ?? null;
}

export function MezgebApplication({
  userId,
  userName,
  businesses,
  activeBusinessId,
  initialTransactions,
  initialCustomers,
  initialTourStep,
  forceTour
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [view, setView] = useState<View>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [entryMode, setEntryMode] = useState<EntryMode>('sale');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [category, setCategory] = useState('general');
  const [customerId, setCustomerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [includeVat, setIncludeVat] = useState(true);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [tourStep, setTourStep] = useState(forceTour ? Math.min(initialTourStep, 4) : initialTourStep);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLimit, setCustomerLimit] = useState('0');
  const [dubeMode, setDubeMode] = useState<DubeMode>('credit_sale');
  const [dubeCustomerId, setDubeCustomerId] = useState('');
  const [dubeAmount, setDubeAmount] = useState('');
  const [dubeDueDate, setDubeDueDate] = useState('');

  const activeBusiness = businesses.find((business) => business.id === activeBusinessId) ?? businesses[0];

  const track = useCallback(async (eventName: string, properties: Record<string, unknown> = {}) => {
    await supabase.from('mezgeb_analytics_events').insert({
      user_id: userId,
      business_id: activeBusiness.id,
      event_name: eventName,
      source: 'app',
      properties
    });
  }, [activeBusiness.id, supabase, userId]);

  const loadData = useCallback(async () => {
    const [{ data: transactionRows, error: transactionError }, { data: customerRows, error: customerError }, { data: receiptRows }] = await Promise.all([
      supabase
        .from('mezgeb_transactions')
        .select('id, business_id, customer_id, type, description, amount, vat_amount, payment_method, occurred_at, category, reference, notes, due_at, mezgeb_customers(name)')
        .eq('business_id', activeBusiness.id)
        .order('occurred_at', { ascending: false })
        .limit(250),
      supabase
        .from('mezgeb_customer_balances')
        .select('id, business_id, name, phone, notes, credit_limit, balance, last_activity_at, earliest_due_at')
        .eq('business_id', activeBusiness.id)
        .order('name', { ascending: true }),
      supabase
        .from('mezgeb_receipts')
        .select('id, transaction_id, receipt_number, total, issued_at, status')
        .eq('business_id', activeBusiness.id)
        .order('issued_at', { ascending: false })
        .limit(100)
    ]);

    if (transactionError) throw transactionError;
    if (customerError) throw customerError;

    setTransactions((transactionRows ?? []).map((item) => ({
      id: item.id,
      businessId: item.business_id,
      customerId: item.customer_id,
      customerName: customerName(item.mezgeb_customers as CustomerRelation),
      type: item.type,
      description: item.description,
      amount: Number(item.amount),
      vatAmount: Number(item.vat_amount),
      paymentMethod: item.payment_method,
      occurredAt: item.occurred_at,
      category: item.category,
      reference: item.reference,
      notes: item.notes,
      dueAt: item.due_at
    })));
    setCustomers((customerRows ?? []).map((item) => ({
      id: item.id,
      businessId: item.business_id,
      name: item.name,
      phone: item.phone,
      notes: item.notes,
      creditLimit: Number(item.credit_limit),
      balance: Number(item.balance),
      lastActivityAt: item.last_activity_at,
      earliestDueAt: item.earliest_due_at
    })));
    setReceipts((receiptRows ?? []).map((item) => ({ ...item, total: Number(item.total) })));
  }, [activeBusiness.id, supabase]);

  useEffect(() => {
    void track('workspace_opened', { view: 'dashboard' });
    void loadData().catch((error: unknown) => setNotice(error instanceof Error ? error.message : 'Workspace data could not be refreshed.'));

    const channel = supabase
      .channel(`mezgeb-business-${activeBusiness.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mezgeb_transactions', filter: `business_id=eq.${activeBusiness.id}` }, () => { void loadData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mezgeb_customers', filter: `business_id=eq.${activeBusiness.id}` }, () => { void loadData(); })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [activeBusiness.id, loadData, supabase, track]);

  const totals = useMemo(() => {
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
  }, [customers, transactions]);

  const visibleTransactions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return transactions;
    return transactions.filter((item) => `${item.description} ${item.customerName ?? ''} ${item.category ?? ''} ${paymentLabel(item.paymentMethod)}`.toLowerCase().includes(normalized));
  }, [query, transactions]);

  async function updateTour(nextStep: number) {
    const completed = nextStep >= 5;
    const { error } = await supabase
      .from('mezgeb_profiles')
      .update({
        product_tour_step: completed ? 5 : nextStep,
        product_tour_completed_at: completed ? new Date().toISOString() : null
      })
      .eq('id', userId);
    if (!error) {
      setTourStep(completed ? 5 : nextStep);
      await track(completed ? 'product_tour_completed' : 'product_tour_advanced', { step: nextStep });
    }
  }

  async function submitTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const numericAmount = Number(amount);
    if (!description.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setNotice('Enter a description and a valid amount.');
      return;
    }
    const isDube = entryMode === 'sale' && paymentMethod === 'dube';
    if (isDube && !customerId) {
      setNotice('Choose a Dube customer before saving a credit sale.');
      return;
    }

    setBusy(true);
    setNotice('Saving securely to Supabase…');
    const type = isDube ? 'credit_sale' : entryMode;
    const vatAmount = activeBusiness.vatRegistered && includeVat ? numericAmount * 15 / 115 : 0;
    const { error } = await supabase.from('mezgeb_transactions').insert({
      business_id: activeBusiness.id,
      customer_id: customerId || null,
      type,
      description: description.trim(),
      amount: numericAmount,
      vat_amount: vatAmount,
      payment_method: paymentMethod,
      category: category.trim() || null,
      due_at: isDube && dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null
    });

    if (error) {
      setNotice(error.message);
      setBusy(false);
      return;
    }

    await track(type === 'credit_sale' ? 'dube_sale_recorded' : `${entryMode}_recorded`, { amount: numericAmount, payment_method: paymentMethod });
    await loadData();
    setDescription('');
    setAmount('');
    setCustomerId('');
    setDueDate('');
    setNotice(`${entryMode === 'sale' ? 'Sale' : 'Expense'} saved and synced.`);
    setBusy(false);
    if (tourStep === 1 && entryMode === 'sale') void updateTour(2);
    if (tourStep === 2 && entryMode === 'expense') void updateTour(3);
  }

  async function removeTransaction(id: string) {
    if (!window.confirm('Remove this transaction from the protected ledger?')) return;
    const { error } = await supabase.from('mezgeb_transactions').delete().eq('id', id).eq('business_id', activeBusiness.id);
    if (error) setNotice(error.message);
    else {
      setNotice('Transaction removed.');
      await track('transaction_deleted', { transaction_id: id });
      await loadData();
    }
  }

  async function addCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || customerNameInput.trim().length < 2) return;
    setBusy(true);
    const { data, error } = await supabase.from('mezgeb_customers').insert({
      business_id: activeBusiness.id,
      name: customerNameInput.trim(),
      phone: customerPhone.trim() || null,
      credit_limit: Math.max(0, Number(customerLimit) || 0)
    }).select('id').single();
    if (error) setNotice(error.message);
    else {
      setCustomerNameInput('');
      setCustomerPhone('');
      setCustomerLimit('0');
      setDubeCustomerId(data.id);
      setNotice('Dube customer added.');
      await track('dube_customer_created');
      await loadData();
      if (tourStep === 3) void updateTour(4);
    }
    setBusy(false);
  }

  async function recordDube(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(dubeAmount);
    if (!dubeCustomerId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setNotice('Choose a customer and enter a valid Dube amount.');
      return;
    }
    setBusy(true);
    const selected = customers.find((customer) => customer.id === dubeCustomerId);
    const { error } = await supabase.from('mezgeb_transactions').insert({
      business_id: activeBusiness.id,
      customer_id: dubeCustomerId,
      type: dubeMode,
      description: dubeMode === 'credit_sale' ? `Dube sale · ${selected?.name ?? 'Customer'}` : `Dube payment · ${selected?.name ?? 'Customer'}`,
      amount: numericAmount,
      vat_amount: dubeMode === 'credit_sale' && activeBusiness.vatRegistered ? numericAmount * 15 / 115 : 0,
      payment_method: dubeMode === 'credit_sale' ? 'dube' : 'cash',
      category: 'dube',
      due_at: dubeMode === 'credit_sale' && dubeDueDate ? new Date(`${dubeDueDate}T12:00:00`).toISOString() : null
    });
    if (error) setNotice(error.message);
    else {
      setDubeAmount('');
      setDubeDueDate('');
      setNotice(dubeMode === 'credit_sale' ? 'Dube sale recorded.' : 'Customer payment recorded.');
      await track(dubeMode === 'credit_sale' ? 'dube_sale_recorded' : 'dube_payment_recorded', { amount: numericAmount });
      await loadData();
      if (tourStep === 3) void updateTour(4);
    }
    setBusy(false);
  }

  async function issueReceipt(transaction: Transaction) {
    if (receipts.some((receipt) => receipt.transaction_id === transaction.id && receipt.status === 'issued')) {
      setNotice('A receipt has already been issued for this transaction.');
      return;
    }
    setBusy(true);
    const receiptNumber = `${activeBusiness.receiptPrefix}-${Date.now().toString().slice(-8)}`;
    const { error } = await supabase.from('mezgeb_receipts').insert({
      business_id: activeBusiness.id,
      customer_id: transaction.customerId,
      transaction_id: transaction.id,
      receipt_number: receiptNumber,
      subtotal: Math.max(0, transaction.amount - transaction.vatAmount),
      vat_amount: transaction.vatAmount,
      total: transaction.amount,
      status: 'issued'
    });
    if (error) setNotice(error.message);
    else {
      setNotice(`Receipt ${receiptNumber} issued.`);
      await track('receipt_issued', { receipt_number: receiptNumber, total: transaction.amount });
      await loadData();
    }
    setBusy(false);
  }

  async function switchBusiness(nextBusinessId: string) {
    await supabase.from('mezgeb_profiles').update({ last_business_id: nextBusinessId }).eq('id', userId);
    router.push(`/app?business=${encodeURIComponent(nextBusinessId)}`);
    router.refresh();
  }

  function beginEntry(mode: EntryMode) {
    setEntryMode(mode);
    setPaymentMethod('cash');
    setView('ledger');
    requestAnimationFrame(() => document.getElementById('transaction-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  const salesTransactions = transactions.filter((item) => item.type === 'sale' || item.type === 'credit_sale');
  const overdueCustomers = customers.filter((customer) => customer.balance > 0 && customer.earliestDueAt && new Date(customer.earliestDueAt).getTime() < Date.now());

  return (
    <div className="cloudMezgebApp">
      <aside className="cloudSidebar">
        <div className="mezgebAppIdentity"><span className="mezgebAppLogo">M</span><div><strong>Mezgeb</strong><small>መዝገብ · Live workspace</small></div></div>
        <label className="cloudBusinessSwitcher"><small>Current business</small><select value={activeBusiness.id} onChange={(event) => void switchBusiness(event.target.value)}>{businesses.map((business) => <option value={business.id} key={business.id}>{business.name}</option>)}</select><span>{activeBusiness.city || activeBusiness.region || 'Ethiopia'} · {activeBusiness.vatRegistered ? 'VAT registered' : 'Standard'}</span></label>
        <nav aria-label="Mezgeb application navigation">{navigation.map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} type="button" onClick={() => { setView(item.id); void track('workspace_viewed', { view: item.id }); }}><i>{item.icon}</i><span>{item.label}</span></button>)}</nav>
        <div className="cloudSidebarFoot"><span className="syncDot" />Supabase sync active</div>
      </aside>

      <section className="cloudWorkspace">
        <header className="cloudTopbar"><div><p>Welcome, {userName}</p><strong>{navigation.find((item) => item.id === view)?.label}</strong></div><div className="cloudTopActions"><span><i /> Live</span><button type="button" onClick={() => void loadData()}>Refresh</button></div></header>
        {notice ? <div className="mezgebNotice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')}>×</button></div> : null}

        <div className="cloudContent">
          {view === 'dashboard' ? <>
            <section className="cloudMetricGrid">
              <article className="cloudPrimaryMetric"><small>Net position</small><strong>{formatMoney(totals.balance)}</strong><div><span>Sales <b>+{money.format(totals.sales)}</b></span><span>Expenses <b>−{money.format(totals.expenses)}</b></span></div></article>
              <article><small>Outstanding Dube</small><strong>{formatMoney(totals.dube)}</strong><span>{customers.filter((customer) => customer.balance > 0).length} customers · {overdueCustomers.length} overdue</span></article>
              <article><small>VAT payable</small><strong>{formatMoney(totals.vatPayable)}</strong><span>{activeBusiness.vatRegistered ? 'Calculated from saved records' : 'VAT not enabled'}</span></article>
            </section>
            <section className="cloudQuickActions" aria-label="Quick actions"><button type="button" onClick={() => beginEntry('sale')}><i>＋</i><span>Add sale</span></button><button type="button" onClick={() => beginEntry('expense')}><i>−</i><span>Add expense</span></button><button type="button" onClick={() => setView('dube')}><i>◎</i><span>Manage Dube</span></button><button type="button" onClick={() => setView('receipts')}><i>▤</i><span>Issue receipt</span></button></section>
            <section className="cloudDashboardGrid">
              <article className="cloudPanel"><header><div><small>Recent activity</small><h3>Live ledger</h3></div><button type="button" onClick={() => setView('ledger')}>View all</button></header><div className="cloudRows">{transactions.slice(0, 6).map((item) => <TransactionRow item={item} key={item.id} />)}{transactions.length === 0 ? <EmptyState text="Your first saved transaction will appear here." /> : null}</div></article>
              <article className="cloudPanel"><header><div><small>Customer credit</small><h3>Dube attention</h3></div><button type="button" onClick={() => setView('dube')}>Open Dube</button></header><div className="cloudRows">{customers.filter((customer) => customer.balance > 0).slice(0, 5).map((customer) => <CustomerRow customer={customer} key={customer.id} />)}{customers.every((customer) => customer.balance <= 0) ? <EmptyState text="No outstanding customer credit." /> : null}</div></article>
              <article className="cloudPanel cloudHealth"><header><div><small>Business health</small><h3>{transactions.length ? 'Records are syncing' : 'Ready for the first record'}</h3></div><span>{Math.min(100, 45 + transactions.length * 4 + customers.length * 3)}</span></header><p>Ledger entries, Dube balances and receipts are stored in the protected {activeBusiness.name} workspace.</p><div><span>Cross-device data</span><b>Active</b></div><div><span>Row Level Security</span><b>Enforced</b></div></article>
            </section>
          </> : null}

          {view === 'ledger' ? <section className="cloudTwoColumn">
            <form className="cloudForm" id="transaction-form" onSubmit={submitTransaction}><header><small>New protected entry</small><h2>Record a transaction</h2></header><div className="cloudSegment"><button type="button" className={entryMode === 'sale' ? 'active sale' : ''} onClick={() => setEntryMode('sale')}>Sale</button><button type="button" className={entryMode === 'expense' ? 'active expense' : ''} onClick={() => setEntryMode('expense')}>Expense</button></div><label>Description<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={entryMode === 'sale' ? 'What did you sell?' : 'What did you pay for?'} required /></label><div className="cloudFormGrid"><label>Amount in ETB<input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></label><label>Category<input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="General" /></label></div><label>Payment method<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option value="cash">Cash</option><option value="telebirr">Telebirr</option><option value="mpesa">M-Pesa</option><option value="cbe_birr">CBE Birr</option><option value="bank">Bank</option>{entryMode === 'sale' ? <option value="dube">Dube credit</option> : null}<option value="other">Other</option></select></label>{entryMode === 'sale' && paymentMethod === 'dube' ? <div className="cloudFormGrid"><label>Dube customer<select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required><option value="">Choose customer</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label><label>Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></div> : null}{activeBusiness.vatRegistered ? <label className="cloudCheck"><input type="checkbox" checked={includeVat} onChange={(event) => setIncludeVat(event.target.checked)} /><span>Amount includes 15% VAT</span></label> : null}<button className="mezgebPrimaryAction" type="submit" disabled={busy}>{busy ? 'Saving…' : `Save ${entryMode}`}</button><small className="cloudSecureHint">Encrypted transport · RLS-isolated · realtime sync</small></form>
            <article className="cloudLedger"><header><div><small>Transaction history</small><h2>Ledger</h2></div><input aria-label="Search transactions" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" /></header><div className="cloudRows">{visibleTransactions.map((item) => <TransactionRow item={item} key={item.id} onRemove={() => void removeTransaction(item.id)} />)}{visibleTransactions.length === 0 ? <EmptyState text="No matching transactions." /> : null}</div></article>
          </section> : null}

          {view === 'dube' ? <section className="cloudDubeLayout">
            <div className="cloudDubeForms"><form className="cloudForm" onSubmit={addCustomer}><header><small>Customer profile</small><h2>Add Dube customer</h2></header><label>Customer name<input value={customerNameInput} onChange={(event) => setCustomerNameInput(event.target.value)} required /></label><label>Phone<input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} inputMode="tel" placeholder="+251…" /></label><label>Credit limit in ETB<input value={customerLimit} onChange={(event) => setCustomerLimit(event.target.value)} inputMode="decimal" /></label><button className="mezgebPrimaryAction" type="submit" disabled={busy}>Add customer</button></form><form className="cloudForm" onSubmit={recordDube}><header><small>Credit activity</small><h2>Record Dube</h2></header><div className="cloudSegment"><button type="button" className={dubeMode === 'credit_sale' ? 'active sale' : ''} onClick={() => setDubeMode('credit_sale')}>Credit sale</button><button type="button" className={dubeMode === 'credit_payment' ? 'active' : ''} onClick={() => setDubeMode('credit_payment')}>Payment</button></div><label>Customer<select value={dubeCustomerId} onChange={(event) => setDubeCustomerId(event.target.value)} required><option value="">Choose customer</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name} · {formatMoney(customer.balance)}</option>)}</select></label><label>Amount in ETB<input value={dubeAmount} onChange={(event) => setDubeAmount(event.target.value)} inputMode="decimal" required /></label>{dubeMode === 'credit_sale' ? <label>Due date<input type="date" value={dubeDueDate} onChange={(event) => setDubeDueDate(event.target.value)} /></label> : null}<button className="mezgebPrimaryAction" type="submit" disabled={busy}>{dubeMode === 'credit_sale' ? 'Save credit sale' : 'Record payment'}</button></form></div>
            <article className="cloudLedger"><header><div><small>Outstanding accounts</small><h2>Dube customers</h2></div><strong>{formatMoney(totals.dube)}</strong></header><div className="cloudCustomerCards">{customers.map((customer) => <CustomerCard customer={customer} key={customer.id} onSelect={() => setDubeCustomerId(customer.id)} />)}{customers.length === 0 ? <EmptyState text="Add the first customer to start managing Dube." /> : null}</div></article>
          </section> : null}

          {view === 'receipts' ? <section className="cloudReceipts"><header className="cloudSectionHeader"><div><small>Professional documents</small><h2>Receipt centre</h2><p>Issue numbered receipts from saved sales. VAT totals follow the business profile.</p></div><span>{receipts.length} issued</span></header><div className="cloudReceiptGrid">{salesTransactions.map((transaction) => { const issued = receipts.find((receipt) => receipt.transaction_id === transaction.id && receipt.status === 'issued'); return <article key={transaction.id}><small>{issued ? issued.receipt_number : 'Ready to issue'}</small><h3>{transaction.description}</h3><p>{transaction.customerName || paymentLabel(transaction.paymentMethod)} · {date.format(new Date(transaction.occurredAt))}</p><strong>{formatMoney(transaction.amount)}</strong><button className="button primary" type="button" disabled={Boolean(issued) || busy} onClick={() => void issueReceipt(transaction)}>{issued ? 'Receipt issued' : 'Issue receipt'}</button></article>; })}{salesTransactions.length === 0 ? <EmptyState text="Record a sale before issuing a receipt." /> : null}</div></section> : null}

          {view === 'reports' ? <section className="cloudReports"><header className="cloudSectionHeader"><div><small>Live reporting</small><h2>Business performance</h2><p>Calculated from the protected ledger for {activeBusiness.name}.</p></div><button className="button" type="button" onClick={() => { void track('report_reviewed'); if (tourStep === 4) void updateTour(5); }}>Mark reviewed</button></header><div className="cloudReportGrid"><article><small>Total sales</small><strong>{formatMoney(totals.sales)}</strong><span>{transactions.filter((item) => item.type === 'sale' || item.type === 'credit_sale').length} sales records</span></article><article><small>Total expenses</small><strong>{formatMoney(totals.expenses)}</strong><span>{transactions.filter((item) => item.type === 'expense' || item.type === 'supplier_purchase').length} expense records</span></article><article><small>Net position</small><strong>{formatMoney(totals.balance)}</strong><span>{totals.balance >= 0 ? 'Positive recorded position' : 'Expenses exceed recorded sales'}</span></article><article><small>Dube exposure</small><strong>{formatMoney(totals.dube)}</strong><span>{overdueCustomers.length} overdue accounts</span></article><article><small>Output VAT</small><strong>{formatMoney(totals.outputVat)}</strong><span>From sales entries</span></article><article><small>Net VAT payable</small><strong>{formatMoney(totals.vatPayable)}</strong><span>Estimate for operational visibility</span></article></div></section> : null}

          {view === 'operations' ? <section className="cloudOperations"><header className="cloudSectionHeader"><div><small>Business configuration</small><h2>{activeBusiness.name}</h2><p>Workspace details used across records, receipts and reports.</p></div><a className="button primary" href="/onboarding?new=1">Add another business</a></header><div className="cloudOperationGrid"><article><small>Business type</small><strong>{activeBusiness.businessType?.replaceAll('_', ' ') || 'Other'}</strong></article><article><small>Location</small><strong>{[activeBusiness.city, activeBusiness.region].filter(Boolean).join(', ') || 'Not added'}</strong></article><article><small>TIN</small><strong>{activeBusiness.tin || 'Not added'}</strong></article><article><small>VAT status</small><strong>{activeBusiness.vatRegistered ? 'VAT registered' : 'Standard'}</strong></article><article><small>Receipt prefix</small><strong>{activeBusiness.receiptPrefix}</strong></article><article><small>Opening balance</small><strong>{formatMoney(activeBusiness.openingBalance)}</strong></article></div></section> : null}
        </div>
      </section>

      {tourStep < 5 ? <aside className="cloudTour" aria-label="Mezgeb product tour"><div><small>Guided setup · {tourStep + 1} of 5</small><h2>{['Welcome to your live workspace','Record the first sale','Add an expense','Set up Dube','Review the reports'][tourStep]}</h2><p>{['Your records now save to Supabase and sync across devices.','Open Ledger and save a sale to begin building the business history.','Record a real operating expense so Mezgeb can calculate the net position.','Add a customer or record Dube activity to track outstanding credit.','Open Reports and review the live totals generated from your records.'][tourStep]}</p></div><footer>{tourStep > 0 ? <button type="button" onClick={() => void updateTour(tourStep - 1)}>Back</button> : <span />}{tourStep === 0 ? <button type="button" className="button primary" onClick={() => { setView('ledger'); setEntryMode('sale'); void updateTour(1); }}>Start tour</button> : tourStep === 1 ? <button type="button" className="button primary" onClick={() => { setView('ledger'); setEntryMode('sale'); }}>Open sale form</button> : tourStep === 2 ? <button type="button" className="button primary" onClick={() => { setView('ledger'); setEntryMode('expense'); }}>Open expense form</button> : tourStep === 3 ? <button type="button" className="button primary" onClick={() => setView('dube')}>Open Dube</button> : <button type="button" className="button primary" onClick={() => setView('reports')}>Open reports</button>}</footer><button className="cloudTourClose" type="button" aria-label="Finish product tour" onClick={() => void updateTour(5)}>×</button></aside> : null}
    </div>
  );
}

function TransactionRow({ item, onRemove }: { item: Transaction; onRemove?: () => void }) {
  const incoming = item.type === 'sale' || item.type === 'credit_sale' || item.type === 'adjustment';
  return <div className="cloudRow"><i className={incoming ? 'income' : 'expense'}>{incoming ? '↗' : '↘'}</i><span><b>{item.description}</b><small>{item.customerName ? `${item.customerName} · ` : ''}{paymentLabel(item.paymentMethod)} · {date.format(new Date(item.occurredAt))}</small></span><strong className={incoming ? 'income' : 'expense'}>{incoming ? '+' : '−'}{money.format(item.amount)}</strong>{onRemove ? <button type="button" aria-label={`Remove ${item.description}`} onClick={onRemove}>×</button> : null}</div>;
}

function CustomerRow({ customer }: { customer: Customer }) {
  return <div className="cloudRow"><i className="neutral">◎</i><span><b>{customer.name}</b><small>{customer.phone || 'No phone'}{customer.earliestDueAt ? ` · Due ${new Intl.DateTimeFormat('en-ET', { month: 'short', day: 'numeric' }).format(new Date(customer.earliestDueAt))}` : ''}</small></span><strong className={customer.balance > 0 ? 'expense' : 'income'}>{formatMoney(customer.balance)}</strong></div>;
}

function CustomerCard({ customer, onSelect }: { customer: Customer; onSelect: () => void }) {
  const overdue = customer.balance > 0 && customer.earliestDueAt && new Date(customer.earliestDueAt).getTime() < Date.now();
  return <button className="cloudCustomerCard" type="button" onClick={onSelect}><span><small>{overdue ? 'Overdue' : customer.balance > 0 ? 'Outstanding' : 'Settled'}</small><strong>{customer.name}</strong><em>{customer.phone || 'No phone added'}</em></span><b>{formatMoney(customer.balance)}</b></button>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="cloudEmpty"><span>◇</span><p>{text}</p></div>;
}
