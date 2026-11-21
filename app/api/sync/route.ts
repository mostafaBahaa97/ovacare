import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/googleSheets';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const strip = (a: any[]) => a.map(({ _row, ...r }) => r);
// Full snapshot in one round trip (protected by middleware cookie check)
export async function GET() {
  try {
    const [s, p, v] = await Promise.all([db.getSettings(), db.list('Patients'), db.list('Visits')]);
    const { password, ...settings } = s as any;
    return NextResponse.json({ settings, patients: strip(p), visits: strip(v) });
  } catch (e: any) { return NextResponse.json({ error: String(e.message || e) }, { status: 500 }); }
}
// Idempotent batch of queued offline mutations
export async function POST(req: NextRequest) {
  try {
    const { ops } = await req.json();
    if (!Array.isArray(ops) || ops.length > 100) return NextResponse.json({ error: 'bad batch' }, { status: 400 });
    return NextResponse.json({ results: await db.applyBatch(ops) });
  } catch (e: any) { return NextResponse.json({ error: String(e.message || e) }, { status: 500 }); }
}
