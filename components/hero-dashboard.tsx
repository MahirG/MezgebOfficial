const rows = [
  ['Cappuccino ×3 + cake', 'Receipt #R-012', '+540', 'income'],
  ['Coffee beans · 5 kg', 'Supplier purchase', '−1,260', 'expense'],
  ['VAT receipt shared', 'Sent to Selam Tadesse', 'PDF', 'neutral']
];

export function HeroDashboard() {
  return (
    <div className="productCanvas" aria-label="Mezgeb dashboard product preview">
      <div className="windowBar"><span /><span /><span /><b>Mezgeb product experience</b></div>
      <div className="dashboardShell">
        <aside className="dashboardRail">
          <strong>Mezgeb</strong>
          {['Dashboard', 'Ledger', 'Receipts', 'Dube', 'Reports'].map((item, index) => <span className={index === 0 ? 'active' : ''} key={item}>{item}</span>)}
          <div className="profitCard"><small>Net profit this month</small><strong>ETB 48,250</strong><em>+24% vs last month</em></div>
        </aside>
        <section className="dashboardMain">
          <div className="dashboardHeading"><div><h2>Good morning, Abebe</h2><p>Abebe&apos;s Cafe · Business overview</p></div><span>Synced</span></div>
          <div className="metrics">
            <article className="metric primaryMetric"><small>Net balance</small><strong><i>ETB</i> 48,250</strong><div><span>Sales today<b>+3,840</b></span><span>Expenses today<b>−1,260</b></span></div></article>
            <article className="metric"><small>Outstanding Dube</small><strong>4,200</strong><em>4 customers</em></article>
            <article className="metric"><small>VAT position</small><strong>7,238</strong><em>Due in 5 days</em></article>
          </div>
          <div className="dashboardGrid">
            <article className="chartPanel"><header><b>7-day activity</b><span>Revenue trend</span></header><svg viewBox="0 0 500 160" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0071e3" stopOpacity=".25"/><stop offset="1" stopColor="#0071e3" stopOpacity="0"/></linearGradient></defs><path d="M0 126C38 120 56 122 82 98s56 0 86-20 48-20 76 0 48-10 72-26 56-19 88-38v120H0Z" fill="url(#area)"/><path d="M0 126C38 120 56 122 82 98s56 0 86-20 48-20 76 0 48-10 72-26 56-19 88-38" fill="none" stroke="#0071e3" strokeWidth="5" strokeLinecap="round"/></svg></article>
            <article className="ledgerPanel"><header><b>Recent ledger</b><span>Today</span></header>{rows.map(([title, meta, amount, kind]) => <div className="ledgerRow" key={title}><i className={kind}>{kind === 'income' ? '↗' : kind === 'expense' ? '↘' : '▤'}</i><span><b>{title}</b><small>{meta}</small></span><strong className={kind}>{amount}</strong></div>)}</article>
          </div>
        </section>
      </div>
    </div>
  );
}
