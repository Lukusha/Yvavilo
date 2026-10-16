import { AppPage } from '@/components/app';
import { AuthGate } from '@/components/auth-gate';
import { CatalogProvider } from '@/lib/catalog';
export default function Page() { return <AuthGate><CatalogProvider><AppPage /></CatalogProvider></AuthGate>; }

export function generateStaticParams(){return ['dashboard','people','flowers','moments','orders','notifications','send','account','operations','space'].map(route=>({slug:[route]}))}
