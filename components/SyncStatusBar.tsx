'use client';
import { useApp } from '@/context/AppContext';
export default function SyncStatusBar({ variant }: { variant: 'dot' | 'banner' }) {
  const { online, sync, pending, lastError, needsReauth, syncNow } = useApp();
  const st = sync === 'syncing' ? 'syncing' : sync === 'error' ? 'error' : !online || pending > 0 || needsReauth ? 'amber' : 'ok';
  if (variant === 'dot') {
    const c = { ok: 'bg-emerald-500', amber: 'bg-amber-500', syncing: 'bg-sky-500 animate-pulse', error: 'bg-red-500' }[st];
    return <span className={`h-2.5 w-2.5 rounded-full ${c}`} title={st === 'ok' ? 'متصل — تمت المزامنة' : 'حالة المزامنة'} />;
  }
  if (st === 'ok') return null;
  const tone = { amber: 'bg-amber-50 text-amber-900 border-amber-200', syncing: 'bg-sky-50 text-sky-900 border-sky-200', error: 'bg-red-50 text-red-800 border-red-200' }[st as 'amber'];
  const text = st === 'syncing' ? `جاري مزامنة ${pending} تعديلات...`
    : st === 'error' ? `تعذرت المزامنة${lastError ? ` (${lastError})` : ''}`
    : !online ? `أنتِ الآن بدون إنترنت — يوجد ${pending} تعديلات محفوظة على جهازك بانتظار المزامنة عند عودة الشبكة`
    : needsReauth ? `يوجد ${pending} تعديلات بانتظار تسجيل الدخول للمزامنة` : `يوجد ${pending} تعديلات بانتظار المزامنة`;
  return (
    <div role="status" className={`no-print border-b px-4 py-1.5 text-sm flex items-center justify-center gap-3 ${tone}`}>
      <span>{text}</span>
      {online && (st === 'error' || (st === 'amber' && !needsReauth)) && <button className="underline font-semibold" onClick={syncNow}>{st === 'error' ? 'إعادة المحاولة' : 'مزامنة الآن'}</button>}
    </div>
  );
}
