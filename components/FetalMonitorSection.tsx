'use client';
import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Fetus, fhrAbnormal } from '@/lib/fetal';
const Seg = ({ opts, value, onChange }: any) => (
  <div className="flex flex-wrap gap-1.5">{opts.map(([k, l]: any) => <button type="button" key={k} className="seg" aria-pressed={value === k} onClick={() => onChange(value === k ? '' : k)}>{l}</button>)}</div>
);
const PRES = [['cephalic', 'رأسي (Cephalic)'], ['breech', 'مقعدي (Breech)'], ['transverse', 'عرضي (Transverse)']];
const PLAC = [['anterior', 'أمامية'], ['posterior', 'خلفية'], ['previa', 'منخفضة Previa']];
const GRADE = [['0', 'Grade 0'], ['I', 'I'], ['II', 'II'], ['III', 'III']];
const LIQ = [['normal', 'طبيعي'], ['low', 'ناقص'], ['high', 'زائد']];
const BIO: [keyof Fetus, string][] = [['crl', 'CRL'], ['bpd', 'BPD'], ['hc', 'HC'], ['ac', 'AC'], ['fl', 'FL']];
export default function FetalMonitorSection({ value, onChange }: { value: Fetus[]; onChange: (v: Fetus[]) => void }) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const set = (i: number, patch: Partial<Fetus>) => onChange(value.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const L = (t: string, el: any) => <div className="space-y-1"><div className="text-sm text-slate-600">{t}</div>{el}</div>;
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3 space-y-3">
      <div className="font-bold">متابعة الجنين</div>
      {value.map((f, i) => {
        const fhr = +(f.fhr || 0); const bad = fhrAbnormal(fhr);
        return (
          <div key={i} className="rounded-xl bg-white p-3 space-y-3 border border-slate-200/70">
            <div className="flex items-center justify-between"><b>{`جنين ${i + 1} (Fetus ${'ABCD'[i] || i + 1})`}</b>{i > 0 && <button type="button" aria-label="حذف الجنين" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 size={16} /></button>}</div>
            <div className="grid grid-cols-2 gap-3">
              {L('نبض الجنين FHR (bpm)', <div className="flex gap-2"><input className="inp" type="number" inputMode="numeric" dir="ltr" value={f.fhr ?? ''} style={bad ? { borderColor: fhr < 90 || fhr > 180 ? '#dc2626' : '#f59e0b', background: fhr < 90 || fhr > 180 ? '#fef2f2' : '#fffbeb' } : {}} onChange={(e) => set(i, { fhr: e.target.value })} /><button type="button" className="seg whitespace-nowrap" aria-pressed={!!f.fhrPositive} onClick={() => set(i, { fhrPositive: !f.fhrPositive })}>موجب (+ve)</button></div>)}
              {L('الوزن التقديري EFW (g)', <div><input className="inp" type="number" inputMode="numeric" dir="ltr" value={f.efw ?? ''} onChange={(e) => set(i, { efw: e.target.value })} />{f.efw && <span className="text-xs text-slate-500" dir="ltr">≈ {(+f.efw / 1000).toFixed(2)} kg</span>}</div>)}
            </div>
            {L('وضع الجنين', <Seg opts={PRES} value={f.presentation} onChange={(v: string) => set(i, { presentation: v })} />)}
            {L('المشيمة', <div className="space-y-1.5"><Seg opts={PLAC} value={f.placenta} onChange={(v: string) => set(i, { placenta: v })} /><Seg opts={GRADE} value={f.grade} onChange={(v: string) => set(i, { grade: v })} /></div>)}
            {L('السائل الأمنيوسي (Liquor / AFI)', <div className="flex flex-wrap items-center gap-2"><Seg opts={LIQ} value={f.liquor} onChange={(v: string) => set(i, { liquor: v })} /><input className="inp !w-24" type="number" dir="ltr" placeholder="AFI" value={f.afi ?? ''} onChange={(e) => set(i, { afi: e.target.value })} /></div>)}
            <button type="button" className="text-sm flex items-center gap-1" style={{ color: 'var(--primary)' }} onClick={() => setOpen({ ...open, [i]: !open[i] })}>{open[i] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}مقاسات السونار التفصيلية — اختياري</button>
            {open[i] && <div className="space-y-2"><div className="grid grid-cols-3 gap-2" dir="ltr">{BIO.map(([k, l]) => <label key={k} className="text-xs text-slate-500">{l} (mm/cm)<input className="inp" inputMode="decimal" value={(f[k] as string) ?? ''} onChange={(e) => set(i, { [k]: e.target.value })} /></label>)}</div><input className="inp" placeholder="ملاحظة عن الجنين" value={f.note ?? ''} onChange={(e) => set(i, { note: e.target.value })} /></div>}
          </div>
        );
      })}
      {value.length < 4 && <button type="button" className="btn btn-o" onClick={() => onChange([...value, {}])}><Plus size={16} />إضافة جنين (توأم)</button>}
    </div>
  );
}
