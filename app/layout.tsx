import type { Metadata, Viewport } from 'next';
import './globals.css';
export const viewport: Viewport = { themeColor: '#3b2631' };
export const metadata: Metadata = { manifest: '/manifest.webmanifest', appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'ყვავილო' }, icons: { icon: [{url:'/icon.svg',type:'image/svg+xml'},{url:'/app-icon-192.png',sizes:'192x192',type:'image/png'}], apple: [{url:'/apple-touch-icon.png',sizes:'180x180',type:'image/png'}] }, title: 'ყვავილო — საჩუქრები გულით', description: 'გაიხსენეთ მნიშვნელოვანი თარიღები, გაუგზავნეთ ყვავილები და იყავით ახლოს მათთან, ვინც გიყვართ.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="ka"><body>{children}</body></html>; }
