'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Logo } from './logo';

const links = [
  ['Product', '/#features'],
  ['Built for Ethiopia', '/#ethiopia'],
  ['Pricing', '/#pricing'],
  ['Security', '/security'],
  ['Product updates', '/#updates']
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="siteHeader">
      <div className="container nav">
        <Link href="/" aria-label="Mezgeb home" onClick={() => setOpen(false)}><Logo /></Link>
        <nav className={open ? 'navLinks open' : 'navLinks'} aria-label="Primary navigation">
          {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
        </nav>
        <div className="navActions">
          <Link className="textButton desktopOnly" href="/auth/sign-in">Sign in</Link>
          <Link className="button primary desktopOnly" href="/auth/sign-up">Create free account</Link>
          <button className="menuButton" type="button" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? '×' : '☰'}
          </button>
        </div>
      </div>
    </header>
  );
}
