'use client';

import { useEffect, useState } from 'react';
import { MezgebMobileControls } from '@/components/mezgeb-mobile-controls';
import { MezgebMobileTopActions } from '@/components/mezgeb-mobile-top-actions';

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
      <MezgebMobileTopActions userName={props.userName} />
    </>
  );
}
