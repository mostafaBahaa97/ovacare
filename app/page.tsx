'use client';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Phone, MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Brand from '@/components/Brand';
import OvaCareLogo from '@/components/OvaCareLogo';
import { pregnancy } from '@/lib/medical';
import { waNumber, telHref } from '@/lib/phone';
function Login() {
  const { login, pending } = useApp(); const [u, setU] = useState(''), [p, setP] = useState(''), [err, setErr] = useState(false);
  return (<div className="min-h-[80vh] grid place-items-center p-4"><form className="card w-full max-w-sm space-y-4" onSubmit={async (e) => { e.preventDefault(); setErr(!(await login(u, p))); }}>
    <div className="flex justify-center"><OvaCareLogo size={52} /></div><Brand />
    {pending > 0 && <p className="rounded-xl bg-amber-50 text-amber-900 text-sm p-2">لديك {pending} تعديلات محفوظة على الجهاز وستتم مزامنتها بعد تسجيل الدخول</p>}
    <input className="inp" placeholder="اسم المستخدم" value={u} onChange={(e) => setU(e.target.value)} dir="ltr" autoComplete="username" />
    <input className="inp" type="password" placeholder="كلمة المرور" value={p} onChange={(e) => setP(e.target.value)} dir="ltr" autoComplete="current-password" />
    {err && <p className="text-red-600 text-sm">بيانات الدخول غير صحيحة</p>}<button className="btn w-full justify-center">تسجيل الدخول</button></form></div>);
}
const ago = (iso: string) => { const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5); if (d <= 0) return 'اليوم'; if (d < 7) return d === 1 ? 'منذ يوم' : `منذ ${d} أيام`; const w = Math.floor(d / 7); if (w < 5) return w === 1 ? 'منذ أسبوع' : w === 2 ? 'منذ أسبوعين' : `منذ ${w} أسابيع`; const m = Math.floor(d / 30); return m === 1 ? 'منذ شهر' : m === 2 ? 'منذ شهرين' : `منذ ${m} أشهر`; };
function Directory() {
  const { patients, visits, loading } = useApp(); const router = useRouter();
  const tab = useSearchParams().get('tab') === 'due' ? 'due' : 'all'; const [q, setQ] = useState('');
  const last = useMemo(() => { const m: Record<string, string> = {}; visits.forEach((v: any) => { if (!m[v.patientId] || v.visitDate > m[v.patientId]) m[v.patientId] = v.visitDate; }); return m; }, [visits]);
  const rows = useMemo(() => {
    const nq = q.replace(/\s/g, '');
    const l = patients.filter((x: any) => x.name && (!q || x.name.includes(q) || (x.phone || '').replace(/\s/g, '').includes(nq))).map((p: any) => ({ p, g: pregnancy(p.lmpDate) }));
    // due soon: GA >= 36w (ignoring stale LMPs beyond 44w), closest EDD first
    if (tab === 'due') return l.filter((r) => r.g && r.g.weeks >= 36 && r.g.weeks <= 44).sort((a, b) => a.g!.edd.getTime() - b.g!.edd.getTime());
    return l.sort((a, b) => a.p.name.localeCompare(b.p.name, 'ar'));
  }, [patients, q, tab]);
  const btn = 'h-10 w-10 grid place-items-center rounded-full transition';
  return (<>
    <h1 className="text-lg font-bold">{tab === 'due' ? 'قريبو الولادة (GA ≥ 36)' : 'المرضى'}</h1>
    <div className="relative"><Search className="absolute top-3 start-3 text-slate-400" size={18} /><input className="inp ps-10" placeholder="بحث بالاسم أو رقم الهاتف" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <div className="space-y-2">{rows.map(({ p, g }: any) => {
      const has = !!(p.phone || '').replace(/\D/g, ''); const days = g ? Math.ceil((g.edd.getTime() - Date.now()) / 864e5) : 0;
      const initials = p.name.trim().split(/\s+/).slice(0, 2).map((w: string) => w[0]).join(' ');
      return (<div key={p.id} role="link" tabIndex={0} onClick={() => router.push(`/patients?id=${p.id}`)} onKeyDown={(e) => e.key === 'Enter' && router.push(`/patients?id=${p.id}`)} className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200/70 p-3 shadow-sm hover:shadow-md cursor-pointer transition">
        <div className="h-11 w-11 shrink-0 rounded-full grid place-items-center font-bold text-sm" style={{ background: 'color-mix(in srgb,var(--primary) 14%,white)', color: 'var(--primary)' }}>{initials}</div>
        <div className="flex-1 min-w-0"><div className="font-semibold truncate">{p.name}</div>
          <div className="flex flex-wrap gap-1 mt-1 text-xs">
            {g && <span className="pill !py-0.5">الأسبوع {g.weeks}</span>}
            {g && g.weeks >= 36 && g.weeks <= 44 && <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 font-semibold">{days >= 0 ? `متبقي ${days} يوم للولادة` : `تجاوزت الموعد بـ ${-days} يوم`}</span>}
            {last[p.id] && <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">آخر زيارة: {ago(last[p.id])}</span>}</div></div>
        <a href={has ? telHref(p.phone) : undefined} aria-label="اتصال" aria-disabled={!has} onClick={(e) => { e.stopPropagation(); if (!has) e.preventDefault(); }} className={`${btn} ${has ? 'bg-sky-50 text-sky-700 hover:bg-sky-100' : 'bg-slate-100 text-slate-300'}`}><Phone size={18} /></a>
        <a href={has ? `https://wa.me/${waNumber(p.phone)}` : undefined} target="_blank" rel="noreferrer" aria-label="واتساب" aria-disabled={!has} onClick={(e) => { e.stopPropagation(); if (!has) e.preventDefault(); }} className={`${btn} ${has ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-300'}`}><MessageCircle size={18} /></a>
      </div>);
    })}
      {!rows.length && <p className="card text-center text-slate-500">{loading ? 'جارٍ التحميل…' : q ? 'لا توجد نتائج' : tab === 'due' ? 'لا توجد مريضات قريبات من الولادة' : 'ابدئي بإضافة أول مريضة'}</p>}</div>
  </>);
}
export default function Home() {
  const { authed, checking } = useApp();
  if (checking) return null;
  if (!authed) return <Login />;
  return <main className="max-w-3xl mx-auto p-4 space-y-4"><Suspense fallback={null}><Directory /></Suspense></main>;
}
