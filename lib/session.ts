// Signed session token (HMAC-SHA256, Web Crypto: works in middleware and route handlers)
const enc = new TextEncoder();
export const COOKIE = 'ova_session';
export const MAX_AGE = 60 * 60 * 24 * 7;
const b64u = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const key = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET (min 32 chars) is required');
  return crypto.subtle.importKey('raw', enc.encode(s), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
};
const mac = async (p: string) => b64u(await crypto.subtle.sign('HMAC', await key(), enc.encode(p)));
export async function createSession() {
  const p = b64u(enc.encode(JSON.stringify({ exp: Date.now() + MAX_AGE * 1000 })));
  return `${p}.${await mac(p)}`;
}
export async function verifySession(token?: string) {
  try {
    const [p, sig] = (token || '').split('.');
    if (!p || !sig) return false;
    const exp = await mac(p);
    let diff = exp.length ^ sig.length;
    for (let i = 0; i < exp.length; i++) diff |= exp.charCodeAt(i) ^ (sig.charCodeAt(i) || 0);
    if (diff) return false;
    return JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/'))).exp > Date.now();
  } catch { return false; }
}
