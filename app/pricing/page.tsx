import type { Metadata } from 'next';
import { PricingPlans } from '@/components/pricing-plans';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Choose the Free or Mezgeb Pro plan. Plan selections are saved securely to the user’s Supabase account.'
};

export default function PricingPage() {
  return <PricingPlans standalone />;
}
