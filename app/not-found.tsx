import Link from 'next/link';
export default function NotFound(){ return <main className="pageShell container"><p className="overline">404</p><h1>That page is not in the ledger.</h1><Link className="button primary" href="/">Return home</Link></main>; }
