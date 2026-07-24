import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding-wizard';
import { createClient } from '@/lib/supabase/server';
import './onboarding.css';

export const metadata: Metadata = {
  title: 'Set up your business',
  description: 'Create a secure Mezgeb business workspace and configure your opening records.'
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function OnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect('/auth/sign-in?next=%2Fonboarding');

  const { data: businesses } = await supabase
    .from('mezgeb_businesses')
    .select('id')
    .limit(1);

  const addingAnother = params.new === '1';
  if ((businesses?.length ?? 0) > 0 && !addingAnother) redirect('/app');

  return (
    <main id="main-content" className="onboardingPage">
      <div className="container onboardingLayout">
        <aside className="onboardingStory">
          <p className="overline">Production workspace</p>
          <h1>Set up Mezgeb around the way your business actually works.</h1>
          <p>
            Your business profile, opening cash balance and preferences will be saved securely in
            Supabase and isolated with Row Level Security.
          </p>
          <div className="onboardingTrust">
            <span><b>01</b> Business identity</span>
            <span><b>02</b> Financial setup</span>
            <span><b>03</b> Ready to record</span>
          </div>
        </aside>
        <OnboardingWizard email={userData.user.email ?? ''} />
      </div>
    </main>
  );
}
