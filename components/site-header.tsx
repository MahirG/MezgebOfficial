'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';

const primaryLinks = [
  ['Home', '/'],
  ['Features', '/#features'],
  ['Pricing', '/#pricing'],
  ['About Us', '/#ethiopia']
] as const;

const resourceLinks = [
  ['Help Center', '/help'],
  ['Security', '/security'],
  ['Privacy', '/privacy']
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const resourcesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setResourcesOpen(false);
  }, [pathname]);

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

  useEffect(() => {
    function closeResources(event: PointerEvent) {
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
    }

    window.addEventListener('pointerdown', closeResources);
    return () => window.removeEventListener('pointerdown', closeResources);
  }, []);

  const closeMenu = () => {
    setOpen(false);
    setResourcesOpen(false);
  };

  return (
    <header className={open ? 'siteHeader menuOpen' : 'siteHeader'}>
      <div className="container navShell">
        <div className="nav">
          <Link className="navBrandLink" href="/" aria-label="Biloo Mezgeb home" onClick={closeMenu}>
            <Logo />
          </Link>

          <nav className="navLinks" aria-label="Primary navigation">
            {primaryLinks.slice(0, 3).map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}

            <div className="navResource" ref={resourcesRef}>
              <button
                className="resourceTrigger"
                type="button"
                aria-expanded={resourcesOpen}
                aria-controls="desktop-resource-menu"
                onClick={() => setResourcesOpen((current) => !current)}
              >
                Resources
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="m6 8 4 4 4-4" />
                </svg>
              </button>
              <div
                className={resourcesOpen ? 'resourceMenu resourceMenuOpen' : 'resourceMenu'}
                id="desktop-resource-menu"
              >
                {resourceLinks.map(([label, href]) => (
                  <Link key={href} href={href} onClick={() => setResourcesOpen(false)}>
                    <span>{label}</span>
                    <small>→</small>
                  </Link>
                ))}
              </div>
            </div>

            {primaryLinks.slice(3).map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="navActions">
            <Link className="textButton desktopOnly" href="/auth/sign-in">
              Log in
            </Link>
            <Link className="button primary desktopOnly" href="/auth/sign-up">
              Get Started
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
            {primaryLinks.map(([label, href]) => (
              <Link key={href} href={href} onClick={closeMenu}>
                <span>{label}</span>
                <small>→</small>
              </Link>
            ))}
          </nav>

          <div className="mobileResourceGroup">
            <p>Resources</p>
            {resourceLinks.map(([label, href]) => (
              <Link key={href} href={href} onClick={closeMenu}>
                {label}
              </Link>
            ))}
          </div>

          <div className="mobileMenuActions">
            <Link className="textButton" href="/auth/sign-in" onClick={closeMenu}>
              Log in
            </Link>
            <Link className="button primary" href="/auth/sign-up" onClick={closeMenu}>
              Get Started Free
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
