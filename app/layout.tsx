import './globals.css';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { AppProvider } from '@/context/AppContext';
import AppNav from '@/components/AppNav';
import ReauthModal from '@/components/ReauthModal';
import InstallPrompt from '@/components/InstallPrompt';
import Footer from '@/components/Footer';
const f = IBM_Plex_Sans_Arabic({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700'] });
export const metadata = {
  title: 'OvaCare', description: 'Smart OB/GYN Clinic Management System', manifest: '/api/manifest.webmanifest',
  icons: { icon: '/api/icon?size=192', shortcut: '/api/icon?size=192', apple: '/api/icon?size=180' },
  appleWebApp: { capable: true, title: 'OvaCare', statusBarStyle: 'default' }, other: { 'mobile-web-app-capable': 'yes' },
};
export const viewport = { themeColor: '#e11d74', width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl"><body className={`${f.className} min-h-screen flex flex-col`}>
      <AppProvider><AppNav /><ReauthModal /><InstallPrompt /><div className="flex-1">{children}</div></AppProvider><Footer />
    </body></html>
  );
}
