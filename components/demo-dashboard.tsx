'use client';

import { useMemo, useState } from 'react';
import { calculateVat, formatEtb } from '@/lib/vat';

type Entry = { id: number; title: string; amount: number; type: 'sale' | 'expense' };
const initial: Entry[] = [
  { id: 1, title: 'Coffee and cake sale', amount: 540, type: 'sale' },
  { id: 2, title: 'Coffee beans purchase', amount: 1260, type: 'expense' },
  { id: 3, title: 'Lunch combo sale', amount: 1250, type: 'sale' }
];

export function DemoDashboard() {
  const [entries, setEntries] = useState(initial);
  const [title, setTitle] = useState('Walk-in sale');
  const [amount, setAmount] = useState(500);
  const totals = useMemo(() => ({ sales: entries.filter(x => x.type === 'sale').reduce((a,b)=>a+b.amount,0), expenses: entries.filter(x => x.type === 'expense').reduce((a,b)=>a+b.amount,0) }), [entries]);
  const vat = calculateVat(amount);
  function add(type: 'sale' | 'expense') { if (amount <= 0) return; setEntries([{ id: Date.now(), title, amount, type }, ...entries]); }
  return <div className="demoApp">
    <div className="demoNotice"><b>Interactive demo</b><span>Sample data only. Nothing is sent to a server.</span><button onClick={() => setEntries(initial)}>Reset demo</button></div>
    <div className="demoMetrics"><article><small>Sales</small><strong>{formatEtb(totals.sales)}</strong></article><article><small>Expenses</small><strong>{formatEtb(totals.expenses)}</strong></article><article><small>Net balance</small><strong>{formatEtb(totals.sales - totals.expenses)}</strong></article></div>
    <div className="demoColumns"><section className="demoForm"><h2>Add a sample entry</h2><label>Description<input value={title} onChange={e=>setTitle(e.target.value)} /></label><label>Amount (ETB)<input type="number" min="1" value={amount} onChange={e=>setAmount(Number(e.target.value))} /></label><div className="demoActions"><button className="button primary" onClick={()=>add('sale')}>Add sale</button><button className="button secondaryDark" onClick={()=>add('expense')}>Add expense</button></div><div className="receiptPreview"><b>VAT receipt preview</b><span>Subtotal <strong>{formatEtb(vat.subtotal)}</strong></span><span>VAT (15%) <strong>{formatEtb(vat.vat)}</strong></span><span>Total <strong>{formatEtb(vat.total)}</strong></span></div></section><section className="demoLedger"><h2>Ledger</h2>{entries.map(entry=><div key={entry.id}><span><b>{entry.title}</b><small>{entry.type === 'sale' ? 'Sale' : 'Expense'}</small></span><strong className={entry.type}>{entry.type === 'sale' ? '+' : '−'}{formatEtb(entry.amount)}</strong></div>)}</section></div>
  </div>;
}
