import { HEART, PETAL } from '@/lib/emblem';
// Lotus/cradling-heart emblem + pearl, with the OvaCare wordmark. Colors follow the active theme.
export default function OvaCareLogo({ size = 40, wordmark = true, className = '' }: { size?: number; wordmark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} dir="ltr" aria-label="OvaCare">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="var(--primary)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={HEART} /><path d={PETAL} fill="var(--primary)" fillOpacity=".18" /><circle cx="32" cy="40" r="4" fill="var(--primary)" stroke="none" />
      </svg>
      {wordmark && <span style={{ fontSize: size * 0.56, lineHeight: 1, letterSpacing: '-0.02em' }} className="font-bold"><span style={{ color: 'var(--primary)' }}>Ova</span><span className="text-slate-700">Care</span></span>}
    </span>
  );
}
