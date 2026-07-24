import { createClient } from '@/lib/supabase/server';

export type BillingCycle = 'monthly' | 'annual';

export type PricingPlan = {
  code: string;
  name: string;
  description: string;
  audience: string;
  capacity: string;
  monthlyPriceEtb: number;
  annualPriceEtb: number;
  features: string[];
  trialDays: number;
  featured: boolean;
  customPricing: boolean;
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

const commercialPlanCodes = new Set(['starter', 'growth', 'business', 'enterprise']);

const fallbackPlans: PricingPlan[] = [
  {
    code: 'starter',
    name: 'Starter',
    description: 'A dependable digital operating record for a small business.',
    audience: 'Small businesses moving from notebooks and scattered messages',
    capacity: '1 business workspace',
    monthlyPriceEtb: 1500,
    annualPriceEtb: 15000,
    features: ['Sales and expense ledger', 'Dube customer credit', 'VAT-aware receipts', 'Core business reports', 'Cross-device Supabase sync', 'Email support'],
    trialDays: 14,
    featured: false,
    customPricing: false
  },
  {
    code: 'growth',
    name: 'Growth',
    description: 'More control for an expanding operation and multiple workspaces.',
    audience: 'Growing businesses that need stronger reporting and support',
    capacity: 'Up to 10 business workspaces',
    monthlyPriceEtb: 4500,
    annualPriceEtb: 45000,
    features: ['Everything in Starter', 'Unlimited receipt records', 'Advanced business reports', 'Multi-business switching', 'Priority onboarding', 'Priority support'],
    trialDays: 14,
    featured: true,
    customPricing: false
  },
  {
    code: 'business',
    name: 'Business',
    description: 'A guided commercial setup for established companies.',
    audience: 'Established businesses coordinating larger operations',
    capacity: 'Commercial implementation',
    monthlyPriceEtb: 9500,
    annualPriceEtb: 95000,
    features: ['Everything in Growth', 'Guided data migration', 'Dedicated onboarding', 'Business configuration review', 'Priority implementation support', 'Commercial account setup'],
    trialDays: 0,
    featured: false,
    customPricing: false
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    description: 'A scoped deployment for complex workflows and integrations.',
    audience: 'Organizations requiring tailored implementation and governance',
    capacity: 'Custom organization scope',
    monthlyPriceEtb: 0,
    annualPriceEtb: 0,
    features: ['Custom deployment planning', 'Integration and API planning', 'Complex migration support', 'Custom roles and approval planning', 'Dedicated implementation management', 'Commercial terms based on scope'],
    trialDays: 0,
    featured: false,
    customPricing: true
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

function normalizeLimits(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {} as Record<string, unknown>;
  return value as Record<string, unknown>;
}

function stringLimit(limits: Record<string, unknown>, key: string, fallback: string) {
  const value = limits[key];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
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
        .select('code, name, description, monthly_price_etb, annual_price_etb, features, trial_days, is_featured, limits')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase.auth.getUser()
    ]);

    const commercialCatalogueReady = !plansError
      && Boolean(planRows?.length)
      && planRows?.every((plan) => commercialPlanCodes.has(String(plan.code)));

    const plans: PricingPlan[] = commercialCatalogueReady && planRows
      ? planRows.map((plan) => {
          const limits = normalizeLimits(plan.limits);
          return {
            code: String(plan.code),
            name: String(plan.name),
            description: String(plan.description ?? ''),
            audience: stringLimit(limits, 'audience', 'Ethiopian businesses building a clearer operating record'),
            capacity: stringLimit(limits, 'capacity', 'Secure cloud workspace'),
            monthlyPriceEtb: normalizeNumber(plan.monthly_price_etb),
            annualPriceEtb: normalizeNumber(plan.annual_price_etb),
            features: normalizeFeatures(plan.features),
            trialDays: normalizeNumber(plan.trial_days),
            featured: Boolean(plan.is_featured),
            customPricing: limits.custom_pricing === true
          };
        })
      : fallbackPlans;

    if (!userData.user) return { plans, subscription: null };

    const { data: subscriptionRow } = await supabase
      .from('mezgeb_subscriptions')
      .select('plan_code, billing_cycle, status, amount_etb, currency, trial_ends_at, current_period_end')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    const subscription: SubscriptionSummary | null = subscriptionRow
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
