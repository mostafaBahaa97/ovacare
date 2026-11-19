'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, UserPlus, Settings, LogOut, Stethoscope, ClipboardList } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import OvaCareLogo from '@/components/OvaCareLogo';
function Brand() {
  const { settings: s } = useApp();
  return (<div className="flex items-center gap-3">{s.clinicLogoUrl ? <img src={s.clinicLogoUrl} alt="" className="h-10 w-10 object-contain" /> : <OvaCareLogo />}
    <div><div className="font-bold leading-tight">{s.doctorName || 'OvaCare'}</div><div className="text-xs text-slate-500">{s.clinicTitle || 'Smart OB/GYN Clinic Management'}</div></div></div>);
}
function Login() {
  const { login } = useApp(); const [u, setU] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState(false);
  return (<div className="min-h-[80vh] grid place-items-center p-4"><form className="card w-full max-w-sm space-y-4" onSubmit={async (e) => { e.preventDefault(); setErr(!(await login(u, p))); }}>
    <Brand /><input className="inp" placeholder="اسم المستخدم" value={u} onChange={(e) => setU(e.target.value)} dir="ltr" autoComplete="username" />
    <input className="inp" type="password" placeholder="كلمة المرور" value={p} onChange={(e) => setP(e.target.value)} dir="ltr" autoComplete="current-password" />
    {err && <p className="text-red-600 text-sm">بيانات الدخول غير صحيحة</p>}<button className="btn w-full justify-center">تسجيل الدخول</button></form></div>);
}
export default function Home() {
  const { authed, checking, patients, role, switchRole, logout, loading } = useApp(); const [q, setQ] = useState('');
  const list = useMemo(() => patients.filter((x: any) => x.name).filter((x: any) => !q || x.name.includes(q) || (x.phone || '').includes(q)).sort((a: any, b: any) => a.name.localeCompare(b.name, 'ar')), [patients, q]);
  if (checking) return null;
  if (!authed) return <Login />;
  return (<main className="max-w-3xl mx-auto p-4 space-y-4">
    <div className="flex items-center justify-between"><Brand />
      <div className="flex gap-2 items-center">
        <button className="pill" onClick={() => switchRole(role === 'doctor' ? 'assistant' : 'doctor')}>{role === 'doctor' ? <><Stethoscope size={14} className="inline" /> وضع الدكتورة</> : <><ClipboardList size={14} className="inline" /> وضع المساعدة</>}</button>
        {role === 'doctor' && <Link href="/settings" aria-label="الإعدادات"><Settings /></Link>}<button onClick={logout} aria-label="خروج"><LogOut /></button></div></div>
    <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute top-2.5 start-3 text-slate-400" size={18} />
      <input className="inp ps-10" placeholder="بحث بالاسم أو رقم الهاتف" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <Link href="/patients/new" className="btn"><UserPlus size={18} />مريضة جديدة</Link></div>
    <div className="card divide-y p-0">{list.map((p: any) => (<Link key={p.id} href={`/patients/${p.id}`} className="flex justify-between p-3 hover:bg-slate-50"><span className="font-medium">{p.name}</span><span className="text-slate-500" dir="ltr">{p.phone}</span></Link>))}
      {!list.length && <p className="p-6 text-center text-slate-500">{loading ? 'جارٍ التحميل…' : q ? 'لا توجد نتائج' : 'ابدئي بإضافة أول مريضة'}</p>}</div></main>);
}
