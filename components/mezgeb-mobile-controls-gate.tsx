'use client';

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
  return (
    <>
      <MezgebMobileControls {...props} />
      <MezgebMobileTopActions userName={props.userName} />
    </>
  );
}
