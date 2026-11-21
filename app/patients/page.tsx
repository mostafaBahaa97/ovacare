'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Eye, EyeOff, AlertTriangle, FileText, Minus, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApp } from '@/context/AppContext';
import { pregnancy, abnormalBP, gaText } from '@/lib/medical';
import PrescriptionModal from '@/components/PrescriptionModal';
import FetalMonitorSection from '@/components/FetalMonitorSection';
import { FetalGrowth, VisitTimeline } from '@/components/FetalCharts';
import { parseFetal } from '@/lib/fetal';
const RX = ['Folic Acid', 'Calcium', 'Iron', 'Aspirin 81mg', 'Progesterone', 'Vitamin D', 'Omega 3', 'Magnesium'];
const TITLES: any = { basic: 'البيانات الأساسية والعلامات الحيوية (Vitals & Basic Info)', history: 'التاريخ الطبي والحمل (GPA & Medical History)', chart: 'متابعة الحمل والرسوم البيانية (Pregnancy & Vitals Chart)', visit: 'الكشف الحالي والروشتة والطلبات القادمة (Current Visit & Prescription)', private: 'ملاحظات الدكتورة الخاصة (Private Notes)' };
const today = () => new Date().toISOString().slice(0, 10);
function PatientPage() {
  const id = useSearchParams().get('id') || 'new'; const router = useRouter();
  const { patients, visits, settings, role, savePatient, saveVisit, saveSettings, authed, checking } = useApp();
  const [p, setP] = useState<any>({ isFirstPregnancy: 'false', gravida: 0, para: 0, abortus: 0 });
  const [v, setV] = useState<any>({ visitDate: today() });
  const [showPriv, setShowPriv] = useState(false); const [rx, setRx] = useState(false); const [busy, setBusy] = useState(false);
  const found = patients.find((x: any) => x.id === id);
  useEffect(() => { if (found) setP((o: any) => (o.id === found.id ? o : found)); }, [found]);
  useEffect(() => { if (!checking && !authed) router.replace('/'); }, [checking, authed, router]);
  if (!authed) return null;
  const isDoc = role === 'doctor';
  let layout: any = { order: Object.keys(TITLES), collapsed: {} };
  try { layout = { ...layout, ...JSON.parse(settings.sectionOrder || '{}') }; } catch {}
  const setLayout = (l: any) => saveSettings({ sectionOrder: JSON.stringify(l) });
  const move = (k: string, d: number) => { const o = [...layout.order]; const a = o.indexOf(k), b = a + d; if (b < 0 || b >= o.length) return; [o[a], o[b]] = [o[b], o[a]]; setLayout({ ...layout, order: o }); };
  const toggle = (k: string) => setLayout({ ...layout, collapsed: { ...layout.collapsed, [k]: !layout.collapsed[k] } });
  const preg = pregnancy(p.lmpDate);
  const mine = visits.filter((x: any) => x.patientId === p.id).sort((a: any, b: any) => a.visitDate.localeCompare(b.visitDate));
  const last = mine[mine.length - 1];
  const weeksAgo = last ? Math.floor((Date.now() - new Date(last.visitDate).getTime()) / 6048e5) : 0;
  const f = (k: string) => ({ className: 'inp', value: p[k] ?? '', onChange: (e: any) => setP({ ...p, [k]: e.target.value }) });
  const fv = (k: string) => ({ className: 'inp', value: v[k] ?? '', onChange: (e: any) => setV({ ...v, [k]: e.target.value }) });
  const L = (t: string, el: any) => <label className="block"><span className="text-sm text-slate-600">{t}</span>{el}</label>;
  const Step = ({ k, t }: any) => (<div className="text-center"><div className="text-sm">{t}</div><div className="flex items-center gap-2 justify-center">
    <button type="button" className="btn btn-o !p-1" onClick={() => setP({ ...p, [k]: Math.max(0, +p[k] - 1 || 0) })}><Minus size={14} /></button><b className="w-6" dir="ltr">{p[k] || 0}</b>
    <button type="button" className="btn btn-o !p-1" onClick={() => setP({ ...p, [k]: (+p[k] || 0) + 1 })}><Plus size={14} /></button></div></div>);
  const save = async () => {
    if (!p.name?.trim()) return alert('اسم المريضة مطلوب');
    setBusy(true); const rec = await savePatient(p); setP(rec);
    if (v.weight || v.bloodPressureSys || v.diagnosisNotes || v.prescribedMedications || v.nextVisitRequests || v.privateVisitNote || v.fetalData)
      setV(await saveVisit({ ...v, patientId: rec.id, gestationalAgeAtVisit: gaText(pregnancy(rec.lmpDate)) }));
    setBusy(false); if (id === 'new') router.replace(`/patients?id=${rec.id}`);
  };
  const data = mine.map((x: any) => ({ d: x.visitDate.slice(5), w: +x.weight || null, s: +x.bloodPressureSys || null, di: +x.bloodPressureDia || null }));
  const body: any = {
    basic: <div className="grid sm:grid-cols-2 gap-3">{L('الاسم *', <input {...f('name')} />)}{L('الهاتف', <input {...f('phone')} dir="ltr" />)}{L('السن', <input {...f('age')} type="number" />)}
      {L('الوزن (kg)', <input {...fv('weight')} type="number" dir="ltr" />)}{L('BP Sys', <input {...fv('bloodPressureSys')} type="number" dir="ltr" />)}{L('BP Dia', <input {...fv('bloodPressureDia')} type="number" dir="ltr" />)}</div>,
    history: <div className="space-y-3"><div className="flex justify-around"><Step k="gravida" t="G (عدد مرات الحمل)" /><Step k="para" t="P (الولادة)" /><Step k="abortus" t="A (الإجهاض)" /></div>
      <div className="grid sm:grid-cols-2 gap-3">{L('تاريخ آخر دورة LMP', <input type="date" {...f('lmpDate')} dir="ltr" />)}
        {L('نوع الولادة السابقة', <select {...f('previousDeliveryType')}><option value="">—</option><option>Normal</option><option>C-Section</option><option>None</option></select>)}
        {L('أمراض مزمنة', <input {...f('chronicDiseases')} />)}{L('تاريخ عائلي', <input {...f('familyHistory')} />)}{L('حساسية دوائية', <input {...f('drugAllergies')} />)}{L('أدوية منتظمة', <input {...f('regularMedications')} />)}{L('تشوهات جنينية سابقة', <input {...f('fetalAnomaliesHistory')} />)}
        <label className="flex gap-2 items-center"><input type="checkbox" checked={p.isFirstPregnancy === 'true' || p.isFirstPregnancy === true} onChange={(e) => setP({ ...p, isFirstPregnancy: String(e.target.checked) })} />أول حمل</label></div></div>,
    chart: <div>{preg ? <div className="flex flex-wrap gap-2 mb-3" dir="ltr"><span className="pill">GA: {gaText(preg)}</span><span className="pill">T{preg.trimester}</span><span className="pill">EDD: {preg.edd.toISOString().slice(0, 10)}</span></div> : <p className="text-sm text-slate-500 mb-2">أدخلي LMP لحساب GA و EDD</p>}
      {data.length > 0 ? <div className="h-64" dir="ltr"><ResponsiveContainer><LineChart data={data}><XAxis dataKey="d" /><YAxis yAxisId="w" /><YAxis yAxisId="b" orientation="right" /><Tooltip /><Legend />
        <Line yAxisId="w" dataKey="w" name="Weight" stroke="var(--primary)" strokeWidth={2} connectNulls />
        <Line yAxisId="b" dataKey="s" name="Sys" stroke="#475569" connectNulls dot={({ cx, cy, payload }: any) => <circle key={payload.d + 's'} cx={cx} cy={cy} r={abnormalBP(payload.s, payload.di) ? 6 : 3} fill={abnormalBP(payload.s, payload.di) ? '#dc2626' : '#475569'} />} />
        <Line yAxisId="b" dataKey="di" name="Dia" stroke="#94a3b8" connectNulls dot={({ cx, cy, payload }: any) => <circle key={payload.d + 'd'} cx={cx} cy={cy} r={abnormalBP(payload.s, payload.di) ? 6 : 3} fill={abnormalBP(payload.s, payload.di) ? '#dc2626' : '#94a3b8'} />} /></LineChart></ResponsiveContainer></div> : <p className="text-slate-500">لا توجد زيارات مسجلة بعد</p>}<FetalGrowth visits={mine} /><VisitTimeline visits={mine} /></div>,
    visit: <div className="space-y-3">{p.drugAllergies && <span className="inline-flex gap-1 items-center rounded-full bg-red-100 text-red-700 px-3 py-1 font-bold"><AlertTriangle size={16} />حساسية: {p.drugAllergies}</span>}
      {L('تاريخ الكشف', <input type="date" {...fv('visitDate')} dir="ltr" />)}{L('التشخيص / الملاحظات', <textarea rows={3} {...fv('diagnosisNotes')} />)}
      <FetalMonitorSection value={parseFetal(v.fetalData)} onChange={(x: any) => setV({ ...v, fetalData: JSON.stringify(x) })} />
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="أدوية سريعة للروشتة">{RX.map((m) => <button type="button" key={m} className="seg whitespace-nowrap" onClick={() => setV({ ...v, prescribedMedications: (v.prescribedMedications ? v.prescribedMedications + '\n' : '') + m })}>+ {m}</button>)}</div>
      {L('الروشتة (دواء وجرعة في كل سطر)', <textarea rows={4} {...fv('prescribedMedications')} />)}{L('المطلوب للزيارة القادمة (سونار، 4D، تحاليل…)', <textarea rows={2} {...fv('nextVisitRequests')} />)}
      <button type="button" className="btn btn-o" onClick={() => setRx(true)}><FileText size={18} />معاينة وطباعة الروشتة</button></div>,
    private: <div className="space-y-3"><button type="button" className="pill" onClick={() => setShowPriv(!showPriv)}>{showPriv ? <EyeOff size={14} className="inline" /> : <Eye size={14} className="inline" />} {showPriv ? 'إخفاء الملاحظات الخاصة' : 'إظهار الملاحظات الخاصة 👁️'}</button>
      {showPriv && <>{L('ملاحظات عن المريضة', <textarea rows={3} {...f('privateNotes')} />)}{L('ملاحظة خاصة بهذه الزيارة', <textarea rows={2} {...fv('privateVisitNote')} />)}</>}</div>,
  };
  const shown = layout.order.filter((k: string) => TITLES[k] && (isDoc || k === 'basic'));
  return (<main className="max-w-3xl mx-auto p-4 space-y-3">
    <button className="text-sm" style={{ color: 'var(--primary)' }} onClick={() => router.push('/')}>← القائمة</button>
    {last && isDoc && <div className="rounded-xl p-4 text-white" style={{ background: 'var(--primary)' }}><div className="font-bold">آخر زيارة كانت {weeksAgo < 1 ? 'منذ أقل من أسبوع' : `منذ ${weeksAgo} أسابيع`}</div>
      {last.nextVisitRequests && <div>المطلوب رؤيته اليوم: {last.nextVisitRequests}</div>}</div>}
    {shown.map((k: string) => (<section key={k} className="card"><div className="flex items-center gap-1"><button className="flex-1 text-start font-bold flex items-center gap-2" onClick={() => toggle(k)}>{layout.collapsed[k] ? <ChevronDown size={18} /> : <ChevronUp size={18} />}{TITLES[k]}</button>
      {isDoc && <><button aria-label="أعلى" onClick={() => move(k, -1)}><ArrowUp size={16} /></button><button aria-label="أسفل" onClick={() => move(k, 1)}><ArrowDown size={16} /></button></>}</div>
      {!layout.collapsed[k] && <div className="mt-3">{body[k]}</div>}</section>))}
    <button className="btn" disabled={busy} onClick={save}>{busy ? 'جارٍ الحفظ…' : 'حفظ'}</button>
    {rx && <PrescriptionModal patient={p} visit={v} onClose={() => setRx(false)} />}</main>);
}

export default function Page() { return <Suspense fallback={null}><PatientPage /></Suspense>; }
