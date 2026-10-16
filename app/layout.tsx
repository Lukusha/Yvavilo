import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { manifest: '/manifest.webmanifest', icons: { icon: '/icon.svg', apple: '/icon.svg' }, title: 'ყვავილო — საჩუქრები გულით', description: 'გაიხსენეთ მნიშვნელოვანი თარიღები, გაუგზავნეთ ყვავილები და იყავით ახლოს მათთან, ვინც გიყვართ.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="ka"><body>{children}</body></html>; }
