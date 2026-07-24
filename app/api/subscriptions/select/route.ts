import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const supportedCycles = new Set(['monthly', 'annual']);
const planCodePattern = /^[a-z0-9_-]{2,40}$/;

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const planCode = typeof body === 'object' && body !== null && 'planCode' in body
    ? String(body.planCode)
    : '';
  const billingCycle = typeof body === 'object' && body !== null && 'billingCycle' in body
    ? String(body.billingCycle)
    : '';

  if (!planCodePattern.test(planCode) || !supportedCycles.has(billingCycle)) {
    return NextResponse.json({ error: 'Choose a valid Mezgeb plan and billing interval.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Sign in before choosing a plan.' }, { status: 401 });
  }

  const { data: plan, error: planError } = await supabase
    .from('mezgeb_plans')
    .select('code, limits')
    .eq('code', planCode)
    .eq('is_active', true)
    .maybeSingle();

  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 });
  if (!plan) return NextResponse.json({ error: 'That Mezgeb plan is not currently available.' }, { status: 400 });

  const limits = plan.limits && typeof plan.limits === 'object' && !Array.isArray(plan.limits)
    ? plan.limits as Record<string, unknown>
    : {};

  if (limits.custom_pricing === true) {
    return NextResponse.json({ error: 'Enterprise pricing requires a scoped commercial conversation.' }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase
    .from('mezgeb_subscriptions')
    .select('id')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const operation = existing
    ? supabase
        .from('mezgeb_subscriptions')
        .update({ plan_code: planCode, billing_cycle: billingCycle })
        .eq('id', existing.id)
        .select('plan_code, billing_cycle, status, amount_etb, currency, trial_ends_at, current_period_end')
        .single()
    : supabase
        .from('mezgeb_subscriptions')
        .insert({ user_id: userData.user.id, plan_code: planCode, billing_cycle: billingCycle })
        .select('plan_code, billing_cycle, status, amount_etb, currency, trial_ends_at, current_period_end')
        .single();

  const { data: subscription, error } = await operation;

  if (error) {
    const duplicateSubscription = error.code === '23505';
    return NextResponse.json(
      { error: duplicateSubscription ? 'A Mezgeb subscription already exists for this account.' : error.message },
      { status: duplicateSubscription ? 409 : 400 }
    );
  }

  return NextResponse.json({ subscription });
}
