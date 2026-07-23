import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';
export default function SignIn(){ return <main id="main-content" className="authPage"><section><p className="overline">Secure account</p><h1>Welcome back to Mezgeb.</h1><p>Authentication requires a dedicated Mezgeb Supabase project.</p><AuthForm mode="sign-in" /><small>No account? <Link href="/auth/sign-up">Create one</Link></small></section></main>; }
