import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { getSettings } from '@/lib/googleSheets';
import { COOKIE, MAX_AGE, createSession, verifySession } from '@/lib/session';
const h = (s: string) => createHash('sha256').update(String(s ?? '')).digest();
export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: await verifySession(req.cookies.get(COOKIE)?.value) });
}
export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const s = await getSettings();
  const ok = timingSafeEqual(h(username), h(s.username)) && timingSafeEqual(h(password), h(s.password));
  if (!ok) { await new Promise((r) => setTimeout(r, 500)); return NextResponse.json({ ok: false }, { status: 401 }); }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await createSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: MAX_AGE });
  return res;
}
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
