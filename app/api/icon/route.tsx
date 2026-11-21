import { ImageResponse } from 'next/og';
import { HEART, PETAL } from '@/lib/emblem';
export const runtime = 'edge';
const mix = (a: string, b: string, t: number) => { const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const size = +(q.get('size') || 512); const S = [180, 192, 512].includes(size) ? size : 512;
  const c = /^[0-9a-f]{6}$/i.test(q.get('c') || '') ? '#' + q.get('c') : '#e11d74';
  const font = await fetch(new URL('../../../lib/fonts/inter-700.woff', import.meta.url)).then((r) => r.arrayBuffer());
  const E = S * 0.36; // emblem + wordmark block stays well inside the 75% maskable safe zone
  return new ImageResponse(
    (<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(145deg, ${c}, ${mix(c, '#4a2a6b', 0.55)})`, fontFamily: 'Inter' }}>
      <svg width={E} height={E} viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"><path d={HEART} /><path d={PETAL} fill="#fff" fillOpacity={0.25} /><circle cx="32" cy="40" r="4" fill="#fff" stroke="none" /></svg>
      <div style={{ display: 'flex', marginTop: S * 0.05, fontSize: S * 0.13, fontWeight: 700, color: '#fff', letterSpacing: -S * 0.004 }}>OvaCare</div>
    </div>),
    { width: S, height: S, fonts: [{ name: 'Inter', data: font, weight: 700, style: 'normal' }], headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } });
}
