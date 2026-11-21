'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
export default function ReauthModal() {
  const { needsReauth, authed, pending, login } = useApp();
  const [u, setU] = useState(''), [p, setP] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [hide, setHide] = useState(false);
  useEffect(() => { if (needsReauth) { setHide(false); setU(localStorage.getItem('ova-user') || ''); } }, [needsReauth]);
  if (!needsReauth || hide || !authed) return null;
  return (
    <div className="no-print fixed inset-0 z-[60] grid place-items-center bg-slate-900/50 p-4">
      <form className="card w-full max-w-sm space-y-3" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(''); const ok = await login(u, p); setBusy(false); if (!ok) setErr('بيانات الدخول غير صحيحة أو لا يوجد اتصال'); else setP(''); }}>
        <p className="font-semibold leading-relaxed">انتهت جلسة الدخول — أعيدي إدخال كلمة المرور لاستكمال مزامنة {pending} تعديلات محفوظة على جهازك</p>
        <input className="inp" dir="ltr" placeholder="اسم المستخدم" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
        <input className="inp" dir="ltr" type="password" placeholder="كلمة المرور" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" autoFocus />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="flex gap-2"><button className="btn flex-1 justify-center" disabled={busy}>{busy ? '…' : 'تسجيل الدخول والمزامنة'}</button><button type="button" className="btn btn-o" onClick={() => setHide(true)}>لاحقاً</button></div>
      </form>
    </div>
  );
}
