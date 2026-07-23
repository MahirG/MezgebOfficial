import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';
export default function SignUp(){ return <main id="main-content" className="authPage"><section><p className="overline">Create your account</p><h1>Start building a clearer business record.</h1><p>Do not enter real financial information until the production backend is configured.</p><AuthForm mode="sign-up" /><small>Already registered? <Link href="/auth/sign-in">Sign in</Link></small></section></main>; }
