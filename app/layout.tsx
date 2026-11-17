import './globals.css';
import { Tajawal } from 'next/font/google';
import { AppProvider } from '@/context/AppContext';
import Footer from '@/components/Footer';
const f = Tajawal({ subsets: ['arabic', 'latin'], weight: ['400', '500', '700'] });
export const metadata = { title: 'OvaCare', description: 'Smart OB/GYN Clinic Management System' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl"><body className={`${f.className} min-h-screen flex flex-col`}>
      <AppProvider><div className="flex-1">{children}</div></AppProvider><Footer />
    </body></html>
  );
}
