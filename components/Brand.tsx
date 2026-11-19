'use client';

import { useApp } from '@/context/AppContext';
import OvaCareLogo from '@/components/OvaCareLogo';

export default function Brand() {
  const { settings: s } = useApp();
  return (
    <div className="flex items-center gap-3">
      {s.clinicLogoUrl ? (
        <img src={s.clinicLogoUrl} alt="" className="h-10 w-10 object-contain" />
      ) : (
        <OvaCareLogo />
      )}
      <div>
        <div className="font-bold leading-tight">{s.doctorName || 'OvaCare'}</div>
        <div className="text-xs text-slate-500">{s.clinicTitle || 'Smart OB/GYN Clinic Management'}</div>
      </div>
    </div>
  );
}