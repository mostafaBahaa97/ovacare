import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/googleSheets';
export const dynamic = 'force-dynamic';
const TAB: Record<string, db.Tab> = { patients: 'Patients', visits: 'Visits' };
const fail = (e: any) => NextResponse.json({ error: String(e.message || e) }, { status: 500 });
export async function GET(_: NextRequest, { params }: any) {
  try {
    const { entity } = await params;
    if (entity === 'settings') { const { password, ...s } = await db.getSettings(); return NextResponse.json(s); }
    return NextResponse.json(await db.list(TAB[entity]));
  } catch (e) { return fail(e); }
}
export async function POST(req: NextRequest, { params }: any) {
  try {
    const { entity } = await params; const b = await req.json(); const now = new Date().toISOString();
    if (entity === 'patients') return NextResponse.json(await db.create('Patients', { ...b, id: b.id || crypto.randomUUID(), createdAt: now, updatedAt: now }));
    return NextResponse.json(await db.create('Visits', { ...b, visitId: b.visitId || crypto.randomUUID() }));
  } catch (e) { return fail(e); }
}
export async function PUT(req: NextRequest, { params }: any) {
  try {
    const { entity } = await params; const b = await req.json();
    if (entity === 'settings') { await db.setSettings(b); return NextResponse.json({ ok: true }); }
    const t = TAB[entity];
    return NextResponse.json(await db.update(t, b[db.KEY[t]], entity === 'patients' ? { ...b, updatedAt: new Date().toISOString() } : b));
  } catch (e) { return fail(e); }
}
export async function DELETE(req: NextRequest, { params }: any) {
  try { const { entity } = await params; const { id } = await req.json(); await db.remove(TAB[entity], id); return NextResponse.json({ ok: true }); }
  catch (e) { return fail(e); }
}
