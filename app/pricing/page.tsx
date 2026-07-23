import type { Metadata } from 'next';
import { PricingPlans, type BillingCycle } from '@/components/pricing-plans';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Choose the Free or Mezgeb Pro plan. Plan selections are saved securely to the user’s Supabase account.'
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PricingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawPlan = params.plan;
  const rawCycle = params.cycle;
  const requestedPlan = typeof rawPlan === 'string' && ['free', 'pro'].includes(rawPlan) ? rawPlan : null;
  const initialCycle: BillingCycle = rawCycle === 'annual' ? 'annual' : 'monthly';

  return <PricingPlans standalone requestedPlan={requestedPlan} initialCycle={initialCycle} />;
}
