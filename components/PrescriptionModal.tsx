'use client';
import { Printer, MessageCircle, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import OvaCareLogo from './OvaCareLogo';
import { pregnancy, gaText } from '@/lib/medical';
export default function PrescriptionModal({ patient, visit, onClose }: any) {
  const { settings: s } = useApp();
  const ga = gaText(pregnancy(patient.lmpDate));
  const date = new Date(visit.visitDate || Date.now()).toLocaleDateString('ar-EG');
  const meds = (visit.prescribedMedications || '').split('\n').filter(Boolean);
  const wa = () => {
    let ph = (patient.phone || '').replace(/\D/g, ''); if (ph.startsWith('0')) ph = '20' + ph.slice(1);
    const t = [`*${s.doctorName || 'OvaCare'}*`, s.clinicTitle, `المريضة: ${patient.name}`, `التاريخ: ${date}`, ga && `GA: ${ga}`, '', '*Rx:*', ...meds.map((m: string, i: number) => `${i + 1}. ${m}`),
      visit.nextVisitRequests && `\n*المطلوب للزيارة القادمة:*\n${visit.nextVisitRequests}`].filter((x) => x !== '' && x !== false && x !== undefined).join('\n');
    window.open(`https://wa.me/${ph}?text=${encodeURIComponent(t)}`, '_blank');
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-auto p-4 print:static print:bg-white print:p-0">
      <div className="no-print max-w-2xl mx-auto mb-3 flex gap-2">
        <button className="btn" onClick={() => window.print()}><Printer size={18} />طباعة / PDF</button>
        <button className="btn btn-o" onClick={wa}><MessageCircle size={18} />واتساب</button>
        <button className="btn btn-o ms-auto" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="print-area max-w-2xl mx-auto bg-white rounded-xl p-8 min-h-[60vh] flex flex-col">
        <header className="flex items-center gap-4 border-b-2 pb-4" style={{ borderColor: 'var(--primary)' }}>
          {s.clinicLogoUrl ? <img src={s.clinicLogoUrl} alt="" className="h-14 w-14 object-contain" /> : <OvaCareLogo size={56} />}
          <div><h1 className="text-xl font-bold" style={{ color: 'var(--primary)' }}>{s.doctorName || 'OvaCare'}</h1><p className="text-sm text-slate-600">{s.clinicTitle}</p></div>
        </header>
        <div className="grid grid-cols-2 gap-2 py-3 text-sm">
          <div>الاسم: <b>{patient.name}</b></div><div>التاريخ: {date}</div>
          <div>السن: {patient.age || '—'}</div><div dir="ltr" className="text-right">{ga && `GA: ${ga}`}</div>
        </div>
        <div className="flex-1"><div className="text-3xl font-serif" style={{ color: 'var(--primary)' }} dir="ltr">Rx</div>
          <ol className="list-decimal ps-6 space-y-2 mt-2">{meds.map((m: string, i: number) => <li key={i}>{m}</li>)}</ol>
          {visit.nextVisitRequests && <div className="mt-6 rounded-lg p-3 bg-slate-50"><b>المطلوب للزيارة القادمة:</b><p className="whitespace-pre-line">{visit.nextVisitRequests}</p></div>}
        </div>
        <footer className="border-t pt-2 mt-6 text-center text-xs text-slate-500">{s.doctorName} — {s.clinicTitle}</footer>
      </div>
    </div>
  );
}
