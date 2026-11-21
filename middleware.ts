import { NextRequest, NextResponse } from 'next/server';
import { COOKIE, verifySession } from '@/lib/session';
// Public: login/session probe, login-screen branding, PWA manifest + icons (no medical data)
const PUBLIC = ['/api/auth', '/api/branding', '/api/manifest.webmanifest', '/api/icon'];
export async function middleware(req: NextRequest) {
  if (PUBLIC.includes(req.nextUrl.pathname)) return NextResponse.next();
  if (await verifySession(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}
export const config = { matcher: '/api/:path*' };
