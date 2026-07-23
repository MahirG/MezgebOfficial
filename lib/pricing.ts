import { createClient } from '@/lib/supabase/server';

export type BillingCycle = 'monthly' | 'annual';

export type PricingPlan = {
  code: string;
  name: string;
  description: string;
  monthlyPriceEtb: number;
  annualPriceEtb: number;
  features: string[];
  trialDays: number;
  featured: boolean;
};

export type SubscriptionSummary = {
  planCode: string;
  billingCycle: BillingCycle;
  status: string;
  amountEtb: number;
  currency: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
};

const fallbackPlans: PricingPlan[] = [
  {
    code: 'free',
    name: 'Free',
    description: 'For starting a digital daily ledger.',
    monthlyPriceEtb: 0,
    annualPriceEtb: 0,
    features: ['Sales and expense ledger', 'Dube credit book', 'Basic reports', 'Up to 30 VAT receipts'],
    trialDays: 0,
    featured: false
  },
  {
    code: 'pro',
    name: 'Mezgeb Pro',
    description: 'For growing businesses needing more control.',
    monthlyPriceEtb: 299,
    annualPriceEtb: 2990,
    features: ['Unlimited VAT receipts', 'Advanced reports', 'Cross-device sync', 'Up to 10 businesses', 'Priority support'],
    trialDays: 7,
    featured: true
  }
];

function normalizeFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((feature): feature is string => typeof feature === 'string' && feature.trim().length > 0);
}

function normalizeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export async function getPricingData(): Promise<{
  plans: PricingPlan[];
  subscription: SubscriptionSummary | null;
}> {
  try {
    const supabase = await createClient();
    const [{ data: planRows, error: plansError }, { data: userData }] = await Promise.all([
      supabase
        .from('mezgeb_plans')
        .select('code, name, description, monthly_price_etb, annual_price_etb, features, trial_days, is_featured')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase.auth.getUser()
    ]);

    const plans = !plansError && planRows?.length
      ? planRows.map((plan) => ({
          code: String(plan.code),
          name: String(plan.name),
          description: String(plan.description ?? ''),
          monthlyPriceEtb: normalizeNumber(plan.monthly_price_etb),
          annualPriceEtb: normalizeNumber(plan.annual_price_etb),
          features: normalizeFeatures(plan.features),
          trialDays: normalizeNumber(plan.trial_days),
          featured: Boolean(plan.is_featured)
        }))
      : fallbackPlans;

    if (!userData.user) return { plans, subscription: null };

    const { data: subscriptionRow } = await supabase
      .from('mezgeb_subscriptions')
      .select('plan_code, billing_cycle, status, amount_etb, currency, trial_ends_at, current_period_end')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    const subscription = subscriptionRow
      ? {
          planCode: String(subscriptionRow.plan_code),
          billingCycle: subscriptionRow.billing_cycle === 'annual' ? 'annual' : 'monthly',
          status: String(subscriptionRow.status),
          amountEtb: normalizeNumber(subscriptionRow.amount_etb),
          currency: String(subscriptionRow.currency ?? 'ETB'),
          trialEndsAt: subscriptionRow.trial_ends_at ? String(subscriptionRow.trial_ends_at) : null,
          currentPeriodEnd: subscriptionRow.current_period_end ? String(subscriptionRow.current_period_end) : null
        }
      : null;

    return { plans, subscription };
  } catch {
    return { plans: fallbackPlans, subscription: null };
  }
}
