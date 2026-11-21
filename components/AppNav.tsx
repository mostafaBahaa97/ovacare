'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Users, Baby, PlusCircle, Settings, LogOut } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Brand from './Brand';
import SyncStatusBar from './SyncStatusBar';
function Nav() {
  const { authed, role, switchRole, logout } = useApp(); const path = usePathname(); const sp = useSearchParams();
  if (!authed) return null;
  const items = [
    { href: '/', label: 'المرضى', Icon: Users, on: path === '/' && sp.get('tab') !== 'due' },
    { href: '/?tab=due', label: 'قريبو الولادة', Icon: Baby, on: path === '/' && sp.get('tab') === 'due' },
    { href: '/patients?id=new', label: '+ حالة جديدة', Icon: PlusCircle, on: path === '/patients' && sp.get('id') === 'new' },
    ...(role === 'doctor' ? [{ href: '/settings', label: 'الإعدادات', Icon: Settings, on: path === '/settings' }] : []),
  ];
  return (<>
    <header className="no-print sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200/70">
      <div className="max-w-5xl mx-auto h-14 px-4 flex items-center gap-3">
        <Brand />
        <nav className="hidden md:flex gap-1 ms-6">{items.map((i) => { const I = i.Icon; return <Link key={i.href} href={i.href} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm ${i.on ? 'font-bold' : 'text-slate-600 hover:bg-slate-100'}`} style={i.on ? { color: 'var(--primary)', background: 'color-mix(in srgb,var(--primary) 10%,white)' } : {}}><I size={16} />{i.label}</Link>; })}</nav>
        <div className="ms-auto flex items-center gap-3"><SyncStatusBar variant="dot" />
          <button className="pill text-xs" onClick={() => switchRole(role === 'doctor' ? 'assistant' : 'doctor')}>{role === 'doctor' ? 'وضع الدكتورة' : 'وضع المساعدة'}</button>
          <button onClick={logout} aria-label="خروج"><LogOut size={18} /></button></div>
      </div>
      <SyncStatusBar variant="banner" />
    </header>
    <nav className="no-print md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200/70 grid" style={{ gridTemplateColumns: `repeat(${items.length},1fr)`, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {items.map((i) => { const I = i.Icon; return <Link key={i.href} href={i.href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${i.on ? 'font-bold' : 'text-slate-500'}`} style={i.on ? { color: 'var(--primary)' } : {}}><I size={22} />{i.label}</Link>; })}
    </nav>
  </>);
}
export default function AppNav() { return <Suspense fallback={null}><Nav /></Suspense>; }
