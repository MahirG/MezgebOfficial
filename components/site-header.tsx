'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <header className={open ? 'siteHeader menuOpen' : 'siteHeader'}>
      <div className="container navShell">
        <div className="nav">
          <Link href="/" aria-label="Mezgeb home" onClick={closeMenu}>
            <Logo />
          </Link>

          <nav className="navLinks" aria-label="Primary navigation">
            {links.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="navActions">
            <Link className="textButton desktopOnly" href="/auth/sign-in">
              Sign in
            </Link>
            <Link className="button primary desktopOnly" href="/auth/sign-up">
              Start 14-day trial
            </Link>
            <button
              className="menuButton"
              type="button"
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={() => setOpen((current) => !current)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        <div className="mobileMenu" id="mobile-navigation" aria-hidden={!open}>
          <nav aria-label="Mobile navigation">
            {links.map(([label, href]) => (
              <Link key={href} href={href} onClick={closeMenu}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="mobileMenuActions">
            <Link className="textButton" href="/auth/sign-in" onClick={closeMenu}>
              Sign in
            </Link>
            <Link className="button primary" href="/auth/sign-up" onClick={closeMenu}>
              Start 14-day trial
            </Link>
          </div>
          <div className="mobileMenuMeta" aria-label="Product highlights">
            <span>Mobile-first</span>
            <span>ETB-ready</span>
            <span>Secure sync</span>
          </div>
        </div>
      </div>

      <button
        className="menuBackdrop"
        type="button"
        aria-label="Close navigation menu"
        tabIndex={open ? 0 : -1}
        onClick={closeMenu}
      />
    </header>
  );
}
