import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MezgebApplication } from '@/components/mezgeb-application';
import { createClient } from '@/lib/supabase/server';
import './app.css';
import './mobile.css';
import './cloud.css';

export const metadata: Metadata = {
  title: 'Mezgeb workspace',
  description: 'Record secure business transactions, Dube customer credit, receipts and reports in Mezgeb.'
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type CustomerRelation = { name: string } | Array<{ name: string }> | null;

export default async function MezgebAppPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect('/auth/sign-in?next=%2Fapp');

  const user = userData.user;
  const [{ data: profile }, { data: businesses, error: businessError }] = await Promise.all([
    supabase
      .from('mezgeb_profiles')
      .select('full_name, last_business_id, product_tour_step, product_tour_completed_at')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('mezgeb_businesses')
      .select('id, name, business_type, region, city, phone, tin, vat_registered, opening_balance, receipt_prefix, onboarding_completed_at')
      .order('created_at', { ascending: true })
  ]);

  if (businessError) throw new Error(businessError.message);
  if (!businesses?.length) redirect('/onboarding');

  const requested = typeof params.business === 'string' ? params.business : null;
  const activeBusiness = businesses.find((item) => item.id === requested)
    ?? businesses.find((item) => item.id === profile?.last_business_id)
    ?? businesses[0];

  const [{ data: rawTransactions, error: transactionError }, { data: customerBalances, error: customerError }] = await Promise.all([
    supabase
      .from('mezgeb_transactions')
      .select('id, business_id, customer_id, type, description, amount, vat_amount, payment_method, occurred_at, category, reference, notes, due_at, mezgeb_customers(name)')
      .eq('business_id', activeBusiness.id)
      .order('occurred_at', { ascending: false })
      .limit(250),
    supabase
      .from('mezgeb_customer_balances')
      .select('id, business_id, name, phone, notes, credit_limit, balance, last_activity_at, earliest_due_at')
      .eq('business_id', activeBusiness.id)
      .order('name', { ascending: true })
  ]);

  if (transactionError) throw new Error(transactionError.message);
  if (customerError) throw new Error(customerError.message);

  const transactions = (rawTransactions ?? []).map((item) => {
    const relation = item.mezgeb_customers as CustomerRelation;
    const customerName = Array.isArray(relation) ? relation[0]?.name : relation?.name;
    return {
      id: item.id,
      businessId: item.business_id,
      customerId: item.customer_id,
      customerName: customerName ?? null,
      type: item.type,
      description: item.description,
      amount: Number(item.amount),
      vatAmount: Number(item.vat_amount),
      paymentMethod: item.payment_method,
      occurredAt: item.occurred_at,
      category: item.category,
      reference: item.reference,
      notes: item.notes,
      dueAt: item.due_at
    };
  });

  const customers = (customerBalances ?? []).map((item) => ({
    id: item.id,
    businessId: item.business_id,
    name: item.name,
    phone: item.phone,
    notes: item.notes,
    creditLimit: Number(item.credit_limit),
    balance: Number(item.balance),
    lastActivityAt: item.last_activity_at,
    earliestDueAt: item.earliest_due_at
  }));

  return (
    <main id="main-content" className="mezgebAppPage productionAppPage">
      <section className="container nativeAppShell" id="mezgeb-application" aria-label="Mezgeb application">
        <MezgebApplication
          userId={user.id}
          userName={profile?.full_name || String(user.user_metadata?.full_name ?? '') || user.email?.split('@')[0] || 'Business owner'}
          businesses={businesses.map((business) => ({
            id: business.id,
            name: business.name,
            businessType: business.business_type,
            region: business.region,
            city: business.city,
            phone: business.phone,
            tin: business.tin,
            vatRegistered: business.vat_registered,
            openingBalance: Number(business.opening_balance),
            receiptPrefix: business.receipt_prefix
          }))}
          activeBusinessId={activeBusiness.id}
          initialTransactions={transactions}
          initialCustomers={customers}
          initialTourStep={profile?.product_tour_completed_at ? 5 : Number(profile?.product_tour_step ?? 0)}
          forceTour={params.tour === '1'}
        />
      </section>
    </main>
  );
}
