import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/googleSheets';
import { themeHex } from '@/lib/theme';
export const dynamic = 'force-dynamic';
export async function GET() {
  const s: any = await getSettings().catch(() => ({}));
  const color = themeHex(s.themeColor);
  const c = color.slice(1);
  const icon = (size: number, purpose: string) => ({ src: `/api/icon?size=${size}&c=${c}`, sizes: `${size}x${size}`, type: 'image/png', purpose });
  const name = s.doctorName || s.clinicTitle || 'OvaCare';
  const body = { name, short_name: String(s.doctorName || 'OvaCare').slice(0, 12), description: s.clinicTitle || 'OvaCare — Smart OB/GYN Clinic Management', lang: 'ar', dir: 'rtl', start_url: '/', scope: '/', display: 'standalone', background_color: '#F8FAFC', theme_color: color,
    icons: [icon(192, 'any'), icon(192, 'maskable'), icon(512, 'any'), icon(512, 'maskable')] };
  return new NextResponse(JSON.stringify(body), { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=300' } });
}
