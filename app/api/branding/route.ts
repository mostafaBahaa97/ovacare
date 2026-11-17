import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/googleSheets';
export const dynamic = 'force-dynamic';
export async function GET() {
  const s = await getSettings();
  return NextResponse.json({ doctorName: s.doctorName, clinicTitle: s.clinicTitle, clinicLogoUrl: s.clinicLogoUrl, themeColor: s.themeColor });
}
