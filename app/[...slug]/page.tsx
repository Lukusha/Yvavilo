import { AppPage } from '@/components/app';
import { AuthGate } from '@/components/auth-gate';
import { CatalogProvider } from '@/lib/catalog';
import { PublicCommerce } from '@/components/public-commerce';
export default function Page() { return <AuthGate publicContent={<CatalogProvider><PublicCommerce/></CatalogProvider>}><CatalogProvider><AppPage /></CatalogProvider></AuthGate>; }

export function generateStaticParams(){return ['dashboard','people','flowers','moments','orders','notifications','send','bag','account','admin','operations','space','track','support','delivery','terms','privacy'].map(route=>({slug:[route]}))}
