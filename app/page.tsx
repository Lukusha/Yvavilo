import { LandingPage } from '@/components/app';
import { AuthGate } from '@/components/auth-gate';
import { CatalogProvider } from '@/lib/catalog';
export default function Page() { return <AuthGate landing><CatalogProvider><LandingPage /></CatalogProvider></AuthGate>; }
