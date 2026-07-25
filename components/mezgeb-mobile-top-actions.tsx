'use client';

import Link from 'next/link';

export function MezgebMobileTopActions({ userName }: { userName: string }) {
  const accountInitial = userName.trim().charAt(0).toUpperCase() || 'A';

  const toggleTheme = () => {
    document.querySelector<HTMLButtonElement>('.mezgebMobileUtility')?.click();
  };

  return (
    <div className="mezgebMobileTopActionOverlay" data-mobile-controls aria-label="Mobile appearance and profile controls">
      <button type="button" className="mezgebMobileTopTheme" onClick={toggleTheme} aria-label="Toggle light or dark mode">
        <span className="mezgebThemeSun" aria-hidden="true">☀</span>
        <span className="mezgebThemeMoon" aria-hidden="true">☾</span>
      </button>
      <Link className="mezgebMobileAccountShortcut" href="/dashboard" aria-label={`Open profile for ${userName}`} title="Profile">
        <span aria-hidden="true">{accountInitial}</span>
      </Link>
    </div>
  );
}
