import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function valid(value: unknown, max = 160) { return typeof value === 'string' && value.trim().length > 1 && value.length <= max; }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !valid(body.name, 100) || !valid(body.contact, 160) || body.consent !== 'on') return NextResponse.json({ message: 'Please complete the required fields.' }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ demo: true, message: 'Saved locally in demo mode. Connect Supabase to receive submissions.' });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { error } = await supabase.from('waitlist').insert({ name: body.name.trim(), contact: body.contact.trim(), business_type: String(body.businessType ?? ''), city: String(body.city ?? ''), consent: true });
  if (error) return NextResponse.json({ message: 'Unable to submit right now.' }, { status: 500 });
  return NextResponse.json({ message: 'Thank you. Your early-access request was received.' });
}
