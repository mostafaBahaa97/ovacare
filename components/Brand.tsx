'use client';
import { useApp } from '@/context/AppContext';
import OvaCareLogo from './OvaCareLogo';
export default function Brand() {
  const { settings: s } = useApp();
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {s.clinicLogoUrl ? <img src={s.clinicLogoUrl} alt="" className="h-9 w-9 object-contain rounded-lg shrink-0" /> : <OvaCareLogo size={30} />}
      <div className="min-w-0 leading-tight"><div className="font-bold truncate text-sm">{s.doctorName || ''}</div><div className="text-[11px] text-slate-500 truncate hidden sm:block">{s.clinicTitle}</div></div>
    </div>
  );
}
