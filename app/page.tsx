import { LandingPage } from '@/components/app';
import { AuthGate } from '@/components/auth-gate';
export default function Page() { return <AuthGate landing><LandingPage /></AuthGate>; }
