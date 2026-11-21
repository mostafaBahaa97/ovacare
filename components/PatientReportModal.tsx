'use client';
import { useEffect, useRef, useState } from 'react';
import { Printer, X, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import OvaCareLogo from './OvaCareLogo';
import PrintPortal from './PrintPortal';
import { abnormalBP, fmtDate, todayLocal, isoDay, gaAr, TRI_AR, DELIVERY_AR, yesNo, gpaText, activePregnancy } from '@/lib/medical';
import { parseFetal, fetalLines } from '@/lib/fetal';
const Cell = ({ k, v }: { k: string; v: any }) => (v ? <div><div style={{ fontSize: 10, color: '#64748b' }}>{k}</div><div style={{ fontWeight: 600 }}>{v}</div></div> : null);
const Title = ({ children }: any) => <h3 style={{ fontWeight: 700, color: 'var(--primary)', borderInlineStart: '4px solid var(--primary)', paddingInlineStart: 8, margin: '14px 0 6px' }}>{children}</h3>;
export default function PatientReportModal({ patient: p, visits, onClose }: any) {
  const { settings: s } = useApp(); const [priv, setPriv] = useState(false); const orig = useRef('');
  const g = activePregnancy(p.lmpDate); const today = fmtDate(todayLocal());
  const list = [...visits].sort((a: any, b: any) => String(a.visitDate).localeCompare(String(b.visitDate))); // oldest → newest
  const last = list[list.length - 1];
  useEffect(() => () => { if (orig.current) document.title = orig.current; }, []);
  const print = () => {
    orig.current = document.title;
    document.title = `تقرير_طبي_${p.name}_${todayLocal()}`.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_'); // default PDF file name
    const done = () => { document.title = orig.current; orig.current = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done); window.print();
  };
  const cards: [string, string][] = ([['الأمراض المزمنة', p.chronicDiseases], ['الأدوية المنتظمة', p.regularMedications], ['التاريخ العائلي', p.familyHistory], ['تشوهات جنينية سابقة', p.fetalAnomaliesHistory]] as [string, string][]).filter(([, v]) => v);
  return (
    <PrintPortal pageCss="@page { size: A4 portrait; margin: 12mm; }">
      <div className="fixed inset-0 z-50 bg-black/50 overflow-auto p-3">
        <div className="no-print max-w-[210mm] mx-auto mb-3 flex flex-wrap items-center gap-2 bg-white rounded-xl p-2">
          <button className="btn" onClick={print}><Printer size={18} />حفظ PDF / طباعة</button>
          <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={priv} onChange={(e) => setPriv(e.target.checked)} />تضمين ملاحظاتي الخاصة</label>
          <button className="btn btn-o ms-auto" onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
          <p className="w-full text-xs text-slate-500">للحفظ كملف PDF، اختاري (Save as PDF / حفظ بتنسيق PDF) من نافذة الطباعة</p>
          {priv && <p className="w-full text-xs text-red-600 font-semibold">سيتضمن التقرير ملاحظاتك الخاصة — لا تسلميه للمريضة أو المستشفى.</p>}
        </div>
        <div className="print-sheet">
          <header className="rpt-row" style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 10, borderBottom: '3px solid var(--primary)' }}>
            {s.clinicLogoUrl ? <img src={s.clinicLogoUrl} alt="" style={{ height: 60, width: 60, objectFit: 'contain' }} /> : <OvaCareLogo size={52} wordmark={false} />}
            <div style={{ flex: 1 }}><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{s.doctorName || 'OvaCare'}</div><div style={{ color: '#475569' }}>{s.clinicTitle}</div></div>
            <div style={{ textAlign: 'end' }}><div style={{ fontSize: 15, fontWeight: 700 }}>تقرير متابعة طبية شامل</div><div style={{ color: '#475569' }}>تاريخ التقرير: {today}</div></div>
          </header>
          <Title>بيانات المريضة والحمل</Title>
          <div className="rpt-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, background: '#f8fafc', borderRadius: 8, padding: 10 }}>
            <Cell k="الاسم" v={p.name} /><Cell k="السن" v={p.age} /><Cell k="رقم الهاتف" v={p.phone && <span dir="ltr">{p.phone}</span>} />
            <Cell k="GPA" v={gpaText(p) !== '—' && <span dir="ltr">{`G ${+p.gravida || 0} / P ${+p.para || 0} / A ${+p.abortus || 0}`}</span>} />
            <Cell k="نوع الولادة السابقة" v={DELIVERY_AR[p.previousDeliveryType]} /><Cell k="أول حمل؟" v={yesNo(p.isFirstPregnancy) !== '—' && yesNo(p.isFirstPregnancy)} />
          </div>
          {g && <div className="rpt-row" style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 14, padding: 10, borderRadius: 8, background: 'color-mix(in srgb,var(--primary) 10%,white)', border: '1px solid var(--primary)' }}>
            <b style={{ color: 'var(--primary)' }}>حمل حالي</b><span dir="ltr">LMP: {fmtDate(p.lmpDate)}</span><span dir="ltr">GA: {g.weeks} Weeks + {g.days} Days</span><span dir="ltr">EDD: {fmtDate(isoDay(g.edd))}</span><span>الثلث {TRI_AR[g.trimester]}</span></div>}
          {(p.drugAllergies || cards.length > 0 || (priv && p.privateNotes)) && <><Title>التنبيهات والتاريخ الطبي</Title>
            {p.drugAllergies && <div className="rpt-row" style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 10, borderRadius: 8, background: '#fef2f2', border: '1px solid #dc2626', color: '#b91c1c', fontWeight: 700, marginBottom: 8 }}><AlertTriangle size={18} />حساسية الأدوية: {p.drugAllergies}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>{cards.map(([k, v]) => <div key={k} className="rpt-row" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }}><Cell k={k} v={<span style={{ whiteSpace: 'pre-line' }}>{v}</span>} /></div>)}
              {priv && p.privateNotes && <div className="rpt-row" style={{ gridColumn: '1 / -1', border: '1px dashed #b45309', background: '#fffbeb', borderRadius: 8, padding: 8 }}><Cell k="ملاحظات الدكتورة الخاصة (نسخة شخصية)" v={<span style={{ whiteSpace: 'pre-line' }}>{p.privateNotes}</span>} /></div>}</div></>}
          <Title>سجل الزيارات والمتابعة (من الأقدم إلى الأحدث)</Title>
          {list.length ? <table className="rpt-table"><colgroup><col style={{ width: '10%' }} /><col style={{ width: '11%' }} /><col style={{ width: '13%' }} /><col style={{ width: '28%' }} /><col style={{ width: '38%' }} /></colgroup>
            <thead><tr><th>التاريخ</th><th>أسبوع الحمل</th><th>الوزن / الضغط</th><th>متابعة الجنين (السونار)</th><th>التشخيص والأدوية والطلبات</th></tr></thead>
            <tbody>{list.map((v: any) => { const fl = fetalLines(parseFetal(v.fetalData)); const bad = abnormalBP(+v.bloodPressureSys, +v.bloodPressureDia); return (
              <tr key={v.visitId}><td>{fmtDate(v.visitDate)}</td><td>{gaAr(v.gestationalAgeAtVisit) || '—'}</td>
                <td>{v.weight ? <div>{v.weight} كجم</div> : null}{v.bloodPressureSys ? <div dir="ltr" style={{ textAlign: 'right', color: bad ? '#dc2626' : undefined, fontWeight: bad ? 700 : 400 }}>BP {v.bloodPressureSys}/{v.bloodPressureDia || '—'}</div> : null}{!v.weight && !v.bloodPressureSys && '—'}</td>
                <td>{fl.length ? fl.map((l, i) => <div key={i} style={{ marginBottom: 3 }}>{l}</div>) : '—'}</td>
                <td style={{ whiteSpace: 'pre-line' }}>{v.diagnosisNotes && <div><b>التشخيص:</b> {v.diagnosisNotes}</div>}{v.prescribedMedications && <div><b>الأدوية:</b> {v.prescribedMedications}</div>}{v.nextVisitRequests && <div><b>المطلوب:</b> {v.nextVisitRequests}</div>}
                  {priv && v.privateVisitNote && <div style={{ marginTop: 4, border: '1px dashed #b45309', background: '#fffbeb', padding: 4 }}><b>ملاحظة خاصة:</b> {v.privateVisitNote}</div>}</td></tr>); })}</tbody></table>
            : <p style={{ color: '#64748b' }}>لا توجد زيارات مسجلة</p>}
          {last?.nextVisitRequests && <div className="rpt-row" style={{ marginTop: 14, padding: 10, borderRadius: 8, border: '2px solid var(--primary)', background: 'color-mix(in srgb,var(--primary) 8%,white)' }}><b style={{ color: 'var(--primary)' }}>المطلوب في الزيارة القادمة:</b><div style={{ whiteSpace: 'pre-line' }}>{last.nextVisitRequests}</div></div>}
          <div className="rpt-row" style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>توقيع الطبيبة: <b>{s.doctorName}</b><div style={{ borderBottom: '1px solid #0f172a', width: 220, marginTop: 30 }} /></div>
            <div style={{ fontSize: 10, color: '#64748b' }}>تاريخ التقرير: {today}</div></div>
          <footer dir="ltr" style={{ marginTop: 16, paddingTop: 6, borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: 10, color: '#64748b' }}>OvaCare — Developed by Mostafa Bahaa</footer>
        </div>
      </div>
    </PrintPortal>
  );
}
