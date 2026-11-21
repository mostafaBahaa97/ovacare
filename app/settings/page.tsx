'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ImagePlus } from 'lucide-react';
import OvaCareLogo from '@/components/OvaCareLogo';
import { compressLogo } from '@/lib/image';
import { exportCsv, exportJson } from '@/lib/backup';
import { useApp, THEMES } from '@/context/AppContext';
export default function SettingsPage() {
  const { settings, saveSettings, authed, checking, patients, visits } = useApp(); const [f, setF] = useState<any>({}); const [saved, setSaved] = useState(false); const [logoErr, setLogoErr] = useState(''); const [err, setErr] = useState('');
  const onLogo = async (e: any) => { const file = e.target.files?.[0]; if (!file) return; try { setLogoErr(''); setF({ ...f, clinicLogoUrl: await compressLogo(file) }); } catch (x: any) { setLogoErr(x.message); } e.target.value = ''; };
  useEffect(() => setF((o: any) => ({ ...settings, ...o })), [settings]);
  const i = (k: string, label: string, extra: any = {}) => (<label className="block"><span className="text-sm">{label}</span><input className="inp" value={f[k] ?? ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} {...extra} /></label>);
  if (checking) return null;
  if (!authed) return <Link href="/" className="p-6 block">سجلي الدخول أولاً</Link>;
  return (<main className="max-w-xl mx-auto p-4 space-y-4"><Link href="/" className="text-sm" style={{ color: 'var(--primary)' }}>← رجوع</Link>
    <div className="card space-y-3"><h2 className="font-bold">الهوية</h2>{i('doctorName', 'اسم الدكتورة')}{i('clinicTitle', 'اسم / وصف العيادة')}<div className="space-y-2"><span className="text-sm">شعار العيادة (اختياري)</span><div className="flex items-center gap-3">{f.clinicLogoUrl ? <img src={f.clinicLogoUrl} alt="" className="h-16 w-16 object-contain rounded border" /> : <OvaCareLogo size={48} />}<label className="btn btn-o cursor-pointer"><ImagePlus size={16} />رفع صورة<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onLogo} /></label>{f.clinicLogoUrl && <button type="button" className="text-sm text-red-600" onClick={() => setF({ ...f, clinicLogoUrl: '' })}>إزالة</button>}</div>{logoErr && <p className="text-red-600 text-sm">{logoErr}</p>}</div>
      <div className="flex gap-3">{Object.entries(THEMES).map(([k, c]) => (<button key={k} aria-label={k} onClick={() => setF({ ...f, themeColor: k })} className="h-9 w-9 rounded-full" style={{ background: c, outline: f.themeColor === k ? '3px solid #0006' : 'none', outlineOffset: 2 }} />))}</div></div>
    <div className="card space-y-3"><h2 className="font-bold">بيانات الدخول</h2>{i('username', 'اسم المستخدم', { dir: 'ltr' })}{i('password', 'كلمة مرور جديدة (اتركيها فارغة بدون تغيير)', { dir: 'ltr', type: 'password', value: f.newPassword ?? '', onChange: (e: any) => setF({ ...f, newPassword: e.target.value }) })}</div>
    <button className="btn" onClick={async () => { const { newPassword, password, ...rest } = f; try { setErr(''); await saveSettings({ ...rest, ...(newPassword ? { password: newPassword } : {}) }); setSaved(true); } catch (x: any) { setErr(x.message); } }}>حفظ الإعدادات</button>{saved && <span className="ms-3 text-green-700">تم الحفظ</span>}{err && <p className="text-red-600 text-sm">{err}</p>}
    <div className="card space-y-3"><h2 className="font-bold">تصدير نسخة احتياطية</h2><p className="text-sm text-slate-500">ملفات UTF-8 تفتح في Excel بالعربية. تحتوي على بيانات المرضى كاملة بما فيها الملاحظات الخاصة، احتفظي بها في مكان آمن.</p><div className="flex flex-wrap gap-2"><button className="btn btn-o" onClick={() => exportCsv('patients', patients)}>المرضى (CSV)</button><button className="btn btn-o" onClick={() => exportCsv('visits', visits)}>الزيارات (CSV)</button><button className="btn btn-o" onClick={() => exportJson(patients, visits)}>الكل (JSON)</button></div></div></main>);
}
