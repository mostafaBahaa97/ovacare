'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { parseFetal, gaWeeks, fetalSummary } from '@/lib/fetal';
import { abnormalBP } from '@/lib/medical';
const COLORS = ['var(--primary)', '#0ea5e9', '#10b981', '#f59e0b'];
export function FetalGrowth({ visits }: { visits: any[] }) {
  const rows = visits.map((v) => { const ga = gaWeeks(v.gestationalAgeAtVisit); const r: any = { ga: ga && +ga.toFixed(1) }; parseFetal(v.fetalData).forEach((f, i) => { if (+(f.efw || 0) > 0) r['f' + i] = +f.efw!; }); return r; }).filter((r) => r.ga && Object.keys(r).length > 1);
  if (!rows.length) return null;
  const n = Math.max(...rows.map((r) => Object.keys(r).filter((k) => k !== 'ga').map((k) => +k.slice(1) + 1).reduce((a, b) => Math.max(a, b), 1)));
  return (
    <div className="mt-4"><div className="text-sm font-semibold mb-1">منحنى نمو وزن الجنين EFW (g) مقابل أسبوع الحمل</div>
      <div className="h-56" dir="ltr"><ResponsiveContainer><LineChart data={rows}><XAxis type="number" dataKey="ga" domain={['dataMin - 1', 'dataMax + 1']} /><YAxis /><Tooltip /><Legend />
        {Array.from({ length: n }, (_, i) => <Line key={i} dataKey={'f' + i} name={`Fetus ${'ABCD'[i]}`} stroke={COLORS[i]} strokeWidth={2} connectNulls />)}</LineChart></ResponsiveContainer></div></div>
  );
}
export function VisitTimeline({ visits }: { visits: any[] }) {
  if (!visits.length) return null;
  return (
    <ul className="mt-4 space-y-2">{[...visits].reverse().map((v) => { const fs = fetalSummary(parseFetal(v.fetalData)); return (
      <li key={v.visitId} className="rounded-xl bg-slate-50 p-2 text-sm flex flex-wrap gap-2 items-center"><b>{v.visitDate}</b>
        {v.gestationalAgeAtVisit && <span className="pill" dir="ltr">{v.gestationalAgeAtVisit}</span>}
        {v.bloodPressureSys && <span dir="ltr" className={abnormalBP(+v.bloodPressureSys, +v.bloodPressureDia) ? 'text-red-600 font-bold' : ''}>BP {v.bloodPressureSys}/{v.bloodPressureDia}</span>}
        {fs && <span className="pill" dir="ltr">{fs}</span>}</li>); })}</ul>
  );
}
