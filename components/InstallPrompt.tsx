'use client';
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
export default function InstallPrompt() {
  const [ev, setEv] = useState<any>(null), [ios, setIos] = useState(false), [show, setShow] = useState(false);
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => {});
    if (matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone || localStorage.getItem('ova-install-dismissed')) return;
    const onP = (e: any) => { e.preventDefault(); setEv(e); setShow(true); };
    window.addEventListener('beforeinstallprompt', onP);
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) { setIos(true); setShow(true); }
    return () => window.removeEventListener('beforeinstallprompt', onP);
  }, []);
  if (!show) return null;
  const close = () => { localStorage.setItem('ova-install-dismissed', '1'); setShow(false); };
  return (
    <div className="no-print fixed z-40 inset-x-3 bottom-20 md:bottom-4 md:max-w-sm md:start-4 md:inset-x-auto card flex items-center gap-3 !p-3 shadow-lg">
      <Download size={20} style={{ color: 'var(--primary)' }} />
      <div className="flex-1 text-sm">{ev ? <button className="font-bold" onClick={async () => { ev.prompt(); await ev.userChoice; close(); }}>تثبيت التطبيق على الهاتف</button> : <span>لتثبيت التطبيق: اضغطي <b>مشاركة</b> ثم <b>إضافة إلى الشاشة الرئيسية</b></span>}</div>
      <button onClick={close} aria-label="إغلاق"><X size={18} /></button>
    </div>
  );
}
