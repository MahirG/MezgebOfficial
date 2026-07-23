import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function safeInternalPath(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = safeInternalPath(requestUrl.searchParams.get('next'));
  const providerError = requestUrl.searchParams.get('error_description') ?? requestUrl.searchParams.get('error');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, requestUrl.origin));

    const signIn = new URL('/auth/sign-in', requestUrl.origin);
    signIn.searchParams.set('error', error.message);
    return NextResponse.redirect(signIn);
  }

  const signIn = new URL('/auth/sign-in', requestUrl.origin);
  signIn.searchParams.set('error', providerError ?? 'The authentication link is invalid or expired.');
  return NextResponse.redirect(signIn);
}
