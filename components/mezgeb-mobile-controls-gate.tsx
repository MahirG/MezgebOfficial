'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MezgebMobileControls } from '@/components/mezgeb-mobile-controls';

type BusinessOption = {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  vatRegistered: boolean;
  businessType: string | null;
  tin: string | null;
  receiptPrefix: string;
  openingBalance: number;
};

type Props = {
  userName: string;
  activeBusinessId: string;
  businesses: BusinessOption[];
};

export function MezgebMobileControlsGate(props: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const accountInitials = useMemo(() => {
    const parts = props.userName.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'A';
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  }, [props.userName]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 820px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  if (!isMobile) return null;

  return (
    <>
      <MezgebMobileControls {...props} />
      <Link
        href="/dashboard"
        className="mezgebMobileAccountShortcut"
        aria-label={`Open ${props.userName} account`}
        title="Account"
      >
        <span aria-hidden="true">{accountInitials}</span>
      </Link>
    </>
  );
}
