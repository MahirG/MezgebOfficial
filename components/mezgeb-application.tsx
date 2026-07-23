'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type View = 'dashboard' | 'ledger' | 'receipts' | 'dube' | 'reports' | 'operations';
type TransactionType = 'sale' | 'expense';

type Transaction = {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  payment: string;
  customer?: string;
  createdAt: string;
};

type CreditAccount = {
  id: string;
  name: string;
  phone: string;
  balance: number;
  lastActivity: string;
};

const storageKey = 'mezgeb-native-app-v1';

const sampleTransactions: Transaction[] = [
  { id: 't-1', type: 'sale', description: 'Cappuccino ×3 and cake', amount: 540, payment: 'Telebirr', customer: 'Selam Tadesse', createdAt: '2026-07-23T08:35:00.000Z' },
  { id: 't-2', type: 'expense', description: 'Coffee beans · 5 kg', amount: 1260, payment: 'Bank', createdAt: '2026-07-23T07:55:00.000Z' },
  { id: 't-3', type: 'sale', description: 'Lunch combo ×5', amount: 1250, payment: 'Cash', createdAt: '2026-07-22T12:20:00.000Z' },
  { id: 't-4', type: 'sale', description: 'Office catering order', amount: 3200, payment: 'M-Pesa', customer: 'Nile Consulting', createdAt: '2026-07-21T10:15:00.000Z' },
  { id: 't-5', type: 'expense', description: 'Electricity and water', amount: 860, payment: 'CBE Birr', createdAt: '2026-07-20T16:40:00.000Z' }
];

const creditAccounts: CreditAccount[] = [
  { id: 'c-1', name: 'Selam Tadesse', phone: '+251 91 234 5678', balance: 1200, lastActivity: '2 days ago' },
  { id: 'c-2', name: 'Meron Alemu', phone: '+251 92 345 6789', balance: 1800, lastActivity: 'Yesterday' },
  { id: 'c-3', name: 'Hanan Yusuf', phone: '+251 93 456 7890', balance: 1200, lastActivity: '5 days ago' }
];

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

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function MezgebApplication() {
  const [view, setView] = useState<View>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions);
  const [transactionType, setTransactionType] = useState<TransactionType>('sale');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payment, setPayment] = useState('Cash');
  const [customer, setCustomer] = useState('');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as Transaction[];
      if (Array.isArray(parsed)) setTransactions(parsed);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(transactions));
  }, [transactions]);

  const totals = useMemo(() => {
    const sales = transactions.filter((item) => item.type === 'sale').reduce((sum, item) => sum + item.amount, 0);
    const expenses = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
    const outputVat = sales * 0.15 / 1.15;
    const inputVat = expenses * 0.15 / 1.15;
    return { sales, expenses, balance: sales - expenses, outputVat, inputVat, vatPayable: Math.max(0, outputVat - inputVat) };
  }, [transactions]);

  const visibleTransactions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return transactions;
    return transactions.filter((item) => `${item.description} ${item.payment} ${item.customer ?? ''}`.toLowerCase().includes(normalized));
  }, [query, transactions]);

  const salesReceipts = transactions.filter((item) => item.type === 'sale');

  function submitTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!description.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setNotice('Enter a description and a valid amount.');
      return;
    }

    const transaction: Transaction = {
      id: createId(),
      type: transactionType,
      description: description.trim(),
      amount: numericAmount,
      payment,
      customer: customer.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    setTransactions((current) => [transaction, ...current]);
    setDescription('');
    setAmount('');
    setCustomer('');
    setNotice(`${transactionType === 'sale' ? 'Sale' : 'Expense'} recorded successfully.`);
    setView('ledger');
  }

  function removeTransaction(id: string) {
    setTransactions((current) => current.filter((item) => item.id !== id));
    setNotice('Transaction removed from this local prototype.');
  }

  function resetData() {
    setTransactions(sampleTransactions);
    localStorage.removeItem(storageKey);
    setNotice('Sample data restored.');
    setView('dashboard');
  }

  function beginTransaction(type: TransactionType) {
    setTransactionType(type);
    setView('ledger');
    requestAnimationFrame(() => document.getElementById('transaction-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  return (
    <div className="nativeMezgebApp">
      <aside className="mezgebAppSidebar">
        <div className="mezgebAppIdentity">
          <span className="mezgebAppLogo">M</span>
          <div><strong>Mezgeb</strong><small>መዝገብ · Business ledger</small></div>
        </div>
        <div className="mezgebBusinessSwitcher"><small>Current business</small><strong>Abebe&apos;s Cafe</strong><span>Addis Ababa · VAT registered</span></div>
        <nav aria-label="Mezgeb application navigation">
          {navigation.map((item) => (
            <button key={item.id} className={view === item.id ? 'active' : ''} type="button" onClick={() => setView(item.id)}>
              <i>{item.icon}</i><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mezgebAppSidebarFoot"><span className="syncDot" />Sample data saved locally</div>
      </aside>

      <section className="mezgebAppWorkspace">
        <header className="mezgebAppTopbar">
          <div><p>Good morning, Abebe</p><strong>{navigation.find((item) => item.id === view)?.label}</strong></div>
          <div className="mezgebTopActions"><span>Interactive prototype</span><button type="button" onClick={resetData}>Reset data</button></div>
        </header>

        {notice ? <div className="mezgebNotice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')}>×</button></div> : null}

        <div className="mezgebAppContent">
          {view === 'dashboard' ? (
            <>
              <section className="mezgebMetricGrid">
                <article className="balanceMetric"><small>Net balance</small><strong>{formatMoney(totals.balance)}</strong><div><span>Sales <b>+{money.format(totals.sales)}</b></span><span>Expenses <b>−{money.format(totals.expenses)}</b></span></div></article>
                <article><small>Outstanding Dube</small><strong>{formatMoney(creditAccounts.reduce((sum, item) => sum + item.balance, 0))}</strong><span>3 active customers</span></article>
                <article><small>VAT payable</small><strong>{formatMoney(totals.vatPayable)}</strong><span>Estimated from sample entries</span></article>
              </section>

              <section className="mezgebQuickActions" aria-label="Quick actions">
                <button type="button" onClick={() => beginTransaction('sale')}><i>＋</i><span>Add sale</span></button>
                <button type="button" onClick={() => beginTransaction('expense')}><i>−</i><span>Add expense</span></button>
                <button type="button" onClick={() => setView('receipts')}><i>▤</i><span>Create receipt</span></button>
                <button type="button" onClick={() => setView('dube')}><i>◎</i><span>Open Dube</span></button>
              </section>

              <section className="mezgebDashboardGrid">
                <article className="mezgebPanel activityPanel"><header><div><small>Performance</small><h3>7-day business activity</h3></div><span>+18.4%</span></header><div className="activityBars" aria-label="Sales and expense chart">{[42,66,52,81,63,92,74].map((height, index) => <div key={height + index}><i style={{height:`${height}%`}} /><b style={{height:`${Math.max(18,height-34)}%`}} /><small>{['M','T','W','T','F','S','S'][index]}</small></div>)}</div></article>
                <article className="mezgebPanel"><header><div><small>Today</small><h3>Recent ledger</h3></div><button type="button" onClick={() => setView('ledger')}>View all</button></header><div className="compactLedger">{transactions.slice(0,4).map((item) => <TransactionRow key={item.id} item={item} />)}</div></article>
                <article className="mezgebPanel vatPanel"><header><div><small>Tax overview</small><h3>VAT position</h3></div><span>15%</span></header><dl><div><dt>Output VAT</dt><dd>{formatMoney(totals.outputVat)}</dd></div><div><dt>Input VAT</dt><dd>{formatMoney(totals.inputVat)}</dd></div><div className="vatTotal"><dt>Net payable</dt><dd>{formatMoney(totals.vatPayable)}</dd></div></dl></article>
                <article className="mezgebPanel healthPanel"><header><div><small>Business health</small><h3>Records are up to date</h3></div><span>92</span></header><p>Your sales, expenses and credit records are organized. Connect a production backend before using real data.</p><div><span>Recording consistency</span><b>Excellent</b></div><div><span>Cash-flow visibility</span><b>Strong</b></div></article>
              </section>
            </>
          ) : null}

          {view === 'ledger' ? (
            <section className="mezgebTwoColumn">
              <form className="mezgebEntryForm" id="transaction-form" onSubmit={submitTransaction}>
                <header><small>New entry</small><h2>Record a transaction</h2></header>
                <div className="typeSelector"><button type="button" className={transactionType === 'sale' ? 'active sale' : ''} onClick={() => setTransactionType('sale')}>Sale</button><button type="button" className={transactionType === 'expense' ? 'active expense' : ''} onClick={() => setTransactionType('expense')}>Expense</button></div>
                <label>Description<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={transactionType === 'sale' ? 'What did you sell?' : 'What did you pay for?'} /></label>
                <label>Amount in ETB<input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></label>
                <label>Payment method<select value={payment} onChange={(event) => setPayment(event.target.value)}><option>Cash</option><option>Telebirr</option><option>M-Pesa</option><option>CBE Birr</option><option>Bank</option><option>Dube</option></select></label>
                <label>Customer or supplier <span>Optional</span><input value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="Name" /></label>
                <button className="mezgebPrimaryAction" type="submit">Save {transactionType}</button>
                <small className="prototypeHint">Saved only in this browser for prototype testing.</small>
              </form>
              <article className="mezgebLedgerPanel"><header><div><small>Transaction history</small><h2>Ledger</h2></div><input aria-label="Search transactions" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" /></header><div className="fullLedger">{visibleTransactions.map((item) => <TransactionRow key={item.id} item={item} onRemove={() => removeTransaction(item.id)} />)}</div></article>
            </section>
          ) : null}

          {view === 'receipts' ? (
            <section className="mezgebTwoColumn receiptWorkspace">
              <article className="receiptDocument"><header><span className="receiptLogo">M</span><div><strong>ABEBE&apos;S CAFE</strong><small>TIN 01234567 · Addis Ababa</small></div></header><div className="receiptMeta"><span>VAT receipt</span><b>R-{String(salesReceipts.length + 12).padStart(4,'0')}</b></div>{salesReceipts.slice(0,3).map((item) => <div className="receiptItem" key={item.id}><span>{item.description}</span><b>{formatMoney(item.amount / 1.15)}</b></div>)}<div className="receiptItem"><span>Subtotal</span><b>{formatMoney(salesReceipts.slice(0,3).reduce((sum,item)=>sum+item.amount/1.15,0))}</b></div><div className="receiptItem"><span>VAT (15%)</span><b>{formatMoney(salesReceipts.slice(0,3).reduce((sum,item)=>sum+item.amount*0.15/1.15,0))}</b></div><div className="receiptGrandTotal"><span>Total</span><b>{formatMoney(salesReceipts.slice(0,3).reduce((sum,item)=>sum+item.amount,0))}</b></div><footer>Thank you · እናመሰግናለን</footer></article>
              <article className="mezgebPanel receiptHistory"><header><div><small>Issued documents</small><h2>Receipt history</h2></div><button type="button" onClick={() => beginTransaction('sale')}>New sale</button></header>{salesReceipts.map((item,index) => <div key={item.id}><span><b>R-{String(index+1).padStart(4,'0')}</b><small>{item.customer ?? 'Walk-in customer'} · {date.format(new Date(item.createdAt))}</small></span><strong>{formatMoney(item.amount)}</strong></div>)}</article>
            </section>
          ) : null}

          {view === 'dube' ? (
            <section><header className="mezgebSectionHeading"><div><small>Customer credit book</small><h2>Dube ዱቤ</h2><p>Track outstanding balances and recent customer activity.</p></div><strong>{formatMoney(creditAccounts.reduce((sum,item)=>sum+item.balance,0))}<small>Total outstanding</small></strong></header><div className="creditGrid">{creditAccounts.map((account) => <article key={account.id}><span className="creditAvatar">{account.name.charAt(0)}</span><div><h3>{account.name}</h3><p>{account.phone}</p><small>Last activity · {account.lastActivity}</small></div><strong>{formatMoney(account.balance)}</strong><button type="button" onClick={() => setNotice(`Reminder prepared for ${account.name}.`)}>Prepare reminder</button></article>)}</div></section>
          ) : null}

          {view === 'reports' ? (
            <section><header className="mezgebSectionHeading"><div><small>Business intelligence</small><h2>Reports</h2><p>Understand income, expenses, profit, VAT and payment channels.</p></div><strong>{formatMoney(totals.balance)}<small>Net result</small></strong></header><div className="reportGrid"><article className="mezgebPanel reportChart"><header><div><small>Monthly comparison</small><h3>Sales and expenses</h3></div></header><div className="reportBars">{[55,72,61,86,74,96].map((height,index)=><div key={height}><i style={{height:`${height}%`}}/><b style={{height:`${height*0.48}%`}}/><small>{['Feb','Mar','Apr','May','Jun','Jul'][index]}</small></div>)}</div></article><article className="mezgebPanel categoryReport"><header><div><small>Expense analysis</small><h3>Top categories</h3></div></header>{[['Supplies',42],['Utilities',24],['Payroll',19],['Other',15]].map(([label,value])=><div key={label}><span>{label}<b>{value}%</b></span><i><em style={{width:`${value}%`}} /></i></div>)}</article><article className="mezgebPanel paymentReport"><header><div><small>Collections</small><h3>Payment channels</h3></div></header>{['Cash','Telebirr','M-Pesa','CBE Birr','Bank'].map((method)=><div key={method}><span>{method}</span><b>{formatMoney(transactions.filter((item)=>item.payment===method&&item.type==='sale').reduce((sum,item)=>sum+item.amount,0))}</b></div>)}</article></div></section>
          ) : null}

          {view === 'operations' ? (
            <section><header className="mezgebSectionHeading"><div><small>Business operations</small><h2>Everything connected</h2><p>Monitor payment channels, stock, suppliers and application preferences.</p></div></header><div className="operationsGrid"><article className="mezgebPanel"><header><div><small>Wallets</small><h3>Mobile money</h3></div><span className="connectedBadge">Connected</span></header>{[['Telebirr','8,420'],['M-Pesa','5,280'],['CBE Birr','3,100'],['Cash drawer','6,740']].map(([name,value])=><div className="operationRow" key={name}><span>{name}</span><b>ETB {value}</b></div>)}</article><article className="mezgebPanel"><header><div><small>Stock control</small><h3>Inventory</h3></div><button type="button" onClick={()=>setNotice('Inventory entry prepared.')}>Add item</button></header>{[['Coffee beans','18 kg','Healthy'],['Fresh milk','6 L','Low stock'],['Paper cups','220','Healthy'],['Cake ingredients','12 packs','Healthy']].map(([name,qty,status])=><div className="operationRow" key={name}><span><b>{name}</b><small>{status}</small></span><strong>{qty}</strong></div>)}</article><article className="mezgebPanel"><header><div><small>Purchasing</small><h3>Suppliers</h3></div></header>{[['Yirgacheffe Coffee Co.','ETB 8,600'],['Addis Dairy','ETB 3,200'],['City Wholesale','ETB 2,450']].map(([name,value])=><div className="operationRow" key={name}><span><b>{name}</b><small>Purchases this month</small></span><strong>{value}</strong></div>)}</article><article className="mezgebPanel settingsPanel"><header><div><small>Application</small><h3>Settings</h3></div></header>{[['Language','English · Amharic'],['Currency','Ethiopian Birr'],['VAT rate','15%'],['Data mode','Local prototype']].map(([name,value])=><div className="operationRow" key={name}><span>{name}</span><b>{value}</b></div>)}</article></div></section>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function TransactionRow({ item, onRemove }: { item: Transaction; onRemove?: () => void }) {
  return <div className="mezgebTransactionRow"><i className={item.type}>{item.type === 'sale' ? '↗' : '↘'}</i><span><b>{item.description}</b><small>{item.customer ?? item.payment} · {date.format(new Date(item.createdAt))}</small></span><strong className={item.type}>{item.type === 'sale' ? '+' : '−'}{formatMoney(item.amount)}</strong>{onRemove ? <button type="button" aria-label={`Remove ${item.description}`} onClick={onRemove}>×</button> : null}</div>;
}
