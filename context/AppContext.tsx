'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { THEMES, themeHex } from '@/lib/theme';
import * as idb from '@/lib/offlineDb';
export { THEMES };
const C = createContext<any>(null);
export const useApp = () => useContext(C);
const KEYF: any = { patient: 'id', visit: 'visitId' };
async function api(url: string, method = 'GET', body?: any) {
  const r = await fetch(url, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  let data: any = null; try { data = await r.json(); } catch {}
  return { status: r.status, ok: r.ok, data };
}
// re-apply still-queued local edits on top of a server snapshot so the UI never "loses" unsynced work
const overlay = (snap: any, q: idb.QueueItem[]) => {
  let settings = { ...(snap?.settings || {}) }, patients: any[] = snap?.patients || [], visits: any[] = snap?.visits || [];
  for (const o of q) {
    if (o.entity === 'settings') { const { password, ...p } = o.payload; settings = { ...settings, ...p }; continue; }
    const k = KEYF[o.entity]; const arr = o.entity === 'patient' ? patients : visits;
    const next = [...arr.filter((x) => x[k] !== o.payload[k]), ...(o.action === 'delete' ? [] : [o.payload])];
    if (o.entity === 'patient') patients = next; else visits = next;
  }
  return { settings, patients, visits };
};
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<any>({ doctorName: '', clinicTitle: '', clinicLogoUrl: '', themeColor: 'rose' });
  const [patients, setPatients] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'doctor' | 'assistant'>('doctor');
  const [online, setOnline] = useState(true);
  const [sync, setSync] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [pending, setPending] = useState(0);
  const [lastError, setLastError] = useState('');
  const [needsReauth, setNeedsReauth] = useState(false);
  const flushing = useRef(false), dirty = useRef(false), authedRef = useRef(false);

  useEffect(() => {
    const c = themeHex(settings.themeColor);
    document.documentElement.style.setProperty('--primary', c);
    document.documentElement.style.setProperty('--primary-fg', '#fff');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c);
  }, [settings.themeColor]);
  useEffect(() => { if (authed && !loading) idb.cacheSet('snapshot', { settings, patients, visits, savedAt: Date.now() }).catch(() => {}); }, [authed, loading, settings, patients, visits]);

  const refreshPending = useCallback(async () => setPending((await idb.queueAll().catch(() => [])).length), []);
  const pull = useCallback(async () => {
    const r = await api('/api/sync');
    if (r.status === 401) { setNeedsReauth(true); return false; }
    if (!r.ok) return false;
    const o = overlay(r.data, await idb.queueAll());
    setSettings((s: any) => ({ ...s, ...o.settings })); setPatients(o.patients); setVisits(o.visits);
    return true;
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current || !authedRef.current || !navigator.onLine) return;
    flushing.current = true; dirty.current = false;
    try {
      setSync('syncing');
      const q = (await idb.queueAll()).sort((a, b) => a.timestamp - b.timestamp);
      let failed = 0;
      for (let i = 0; i < q.length; i += 50) {
        const chunk = q.slice(i, i + 50);
        const r = await api('/api/sync', 'POST', { ops: chunk.map(({ id, entity, action, payload }) => ({ id, entity, action, payload })) });
        if (r.status === 401) { setNeedsReauth(true); setSync('idle'); await refreshPending(); return; } // queue stays intact; re-auth modal resumes it
        if (!r.ok) throw new Error(r.data?.error || 'خطأ في الخادم');
        for (const res of r.data.results) {
          const item = chunk.find((c) => c.id === res.id); if (!item) continue;
          if (res.ok) await idb.queueDelIfUnchanged(item.id, item.timestamp);
          else { failed++; setLastError(res.error || ''); await idb.queueMarkIfUnchanged(item.id, item.timestamp, { retryCount: item.retryCount + 1, lastError: res.error || '' }); }
        }
        await refreshPending();
      }
      if (failed) { setSync('error'); return; }
      setLastError(''); setSync('idle');
      await pull();
    } catch (e: any) { setSync('error'); setLastError(e?.message === 'Failed to fetch' ? 'تعذر الاتصال بالخادم' : e?.message || ''); }
    finally { flushing.current = false; setLoading(false); if (dirty.current) setTimeout(flush, 50); }
  }, [pull, refreshPending]);

  useEffect(() => {
    setRole((localStorage.getItem('ova-role') as any) || 'doctor'); setOnline(navigator.onLine);
    localStorage.removeItem('ova-patients'); localStorage.removeItem('ova-visits'); // legacy plaintext cache
    (async () => {
      const snap = await idb.cacheGet('snapshot').catch(() => null);
      const q = await idb.queueAll().catch(() => [] as idb.QueueItem[]); setPending(q.length);
      let a: any = null; try { a = await api('/api/auth'); } catch {}
      if (a?.data?.ok || (!a && snap)) { // valid cookie, or offline with a local snapshot
        authedRef.current = true; setAuthed(true);
        if (snap) { const o = overlay(snap, q); setSettings((s: any) => ({ ...s, ...o.settings })); setPatients(o.patients); setVisits(o.visits); setLoading(false); }
        setChecking(false); flush();
      } else { // login screen (cached data is kept for pending sync, never displayed)
        if (snap?.settings) { const { clinicLogoUrl, doctorName, clinicTitle, themeColor } = snap.settings; setSettings((s: any) => ({ ...s, clinicLogoUrl, doctorName, clinicTitle, themeColor })); }
        const b = a ? await api('/api/branding').catch(() => null) : null;
        if (b?.ok) setSettings((s: any) => ({ ...s, ...b.data }));
        setLoading(false); setChecking(false);
      }
    })();
    const on = () => { setOnline(true); flush(); }, off = () => setOnline(false), foc = () => flush();
    window.addEventListener('online', on); window.addEventListener('offline', off); window.addEventListener('focus', foc);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); window.removeEventListener('focus', foc); };
  }, [flush]);

  const mutate = async (entity: string, action: string, payload: any) => {
    const id = entity === 'settings' ? 'settings:main' : `${entity}:${payload[KEYF[entity]]}`;
    let pl = payload;
    if (entity === 'settings') pl = { ...((await idb.queueAll()).find((x) => x.id === id)?.payload || {}), ...payload };
    await idb.queuePut({ id, entity: entity as any, action: action as any, payload: pl, timestamp: Date.now(), retryCount: 0, lastError: '' });
    dirty.current = true; await refreshPending(); flush();
  };
  const login = async (username: string, password: string) => {
    try { const r = await api('/api/auth', 'POST', { username, password }); if (!r.ok) return false; } catch { return false; }
    localStorage.setItem('ova-user', username);
    authedRef.current = true; setAuthed(true); setNeedsReauth(false); setLoading(true);
    await refreshPending(); await flush();
    return true;
  };
  const logout = async () => {
    await flush();
    const n = (await idb.queueAll().catch(() => [])).length;
    if (n > 0 && !confirm(`يوجد ${n} تعديلات لم تتم مزامنتها وسيتم حذفها من هذا الجهاز. هل تريدين تسجيل الخروج؟`)) return;
    await api('/api/auth', 'DELETE').catch(() => {});
    await idb.wipeAll().catch(() => {}); localStorage.removeItem('ova-user');
    authedRef.current = false; setAuthed(false); setPatients([]); setVisits([]); setPending(0); setNeedsReauth(false);
  };
  const switchRole = (r: 'doctor' | 'assistant') => { setRole(r); localStorage.setItem('ova-role', r); };
  const savePatient = async (p: any) => {
    const now = new Date().toISOString(); const rec = { ...p, id: p.id || crypto.randomUUID(), createdAt: p.createdAt || now, updatedAt: now };
    setPatients((l) => (l.some((x) => x.id === rec.id) ? l.map((x) => (x.id === rec.id ? { ...x, ...rec } : x)) : [...l, rec]));
    await mutate('patient', 'upsert', rec); return rec;
  };
  const saveVisit = async (v: any) => {
    const rec = { ...v, visitId: v.visitId || crypto.randomUUID() };
    setVisits((l) => [...l.filter((x) => x.visitId !== rec.visitId), rec]);
    await mutate('visit', 'upsert', rec); return rec;
  };
  const saveSettings = async (patch: any) => {
    const { password, ...safe } = patch;
    if (password) { // credentials never sit in IndexedDB: password changes need a live connection
      const r = await api('/api/sync', 'POST', { ops: [{ id: 'settings:pw', entity: 'settings', action: 'upsert', payload: { password } }] }).catch(() => null);
      if (!r?.ok || !r.data?.results?.[0]?.ok) throw new Error('تغيير كلمة المرور يتطلب اتصالاً بالإنترنت');
    }
    if (Object.keys(safe).length) { setSettings((s: any) => ({ ...s, ...safe })); await mutate('settings', 'upsert', safe); }
  };
  return <C.Provider value={{ settings, patients, visits, authed, checking, role, loading, online, sync, pending, lastError, needsReauth, login, logout, switchRole, savePatient, saveVisit, saveSettings, syncNow: flush, refresh: flush }}>{children}</C.Provider>;
}
