export default function OvaCareLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label="OvaCare">
      <path d="M32 50C20 44 12 34 14 22c8 0 14 5 18 12 4-7 10-12 18-12 2 12-6 22-18 28z" />
      <path d="M32 34V14" /><path d="M32 22c-5-1-8-4-9-8 5 0 8 3 9 8zM32 22c5-1 8-4 9-8-5 0-8 3-9 8z" fill="var(--primary)" fillOpacity=".18" />
      <path d="M8 56h12l4-6 6 10 5-8 3 4h18" strokeWidth="2.5" />
    </svg>
  );
}
