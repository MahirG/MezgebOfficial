'use client';

import Link from 'next/link';

export function MezgebMobileTopActions({ userName }: { userName: string }) {
  const accountInitial = userName.trim().charAt(0).toUpperCase() || 'A';

  return (
    <div
      className="mezgebMobileTopActionOverlay"
      data-mobile-controls
      aria-label="Mobile profile control"
    >
      <Link
        className="mezgebMobileAccountShortcut"
        href="/dashboard"
        aria-label={`Open profile for ${userName}`}
        title="Profile"
      >
        <span aria-hidden="true">{accountInitial}</span>
      </Link>
    </div>
  );
}
