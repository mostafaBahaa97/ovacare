'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
export const THEMES: Record<string, string> = { rose: '#e11d74', teal: '#0d9488', blue: '#2563eb', violet: '#7c3aed', emerald: '#059669' };
const C = createContext<any>(null);
export const useApp = () => useContext(C);
let onUnauth = () => {};
const j = async (url: string, method = 'GET', body?: any) => {
  const r = await fetch(url, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  if (r.status === 401 && url !== '/api/auth') onUnauth();
  return r.json();
};
const clearCache = () => { localStorage.removeItem('ova-patients'); localStorage.removeItem('ova-visits'); };
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<any>({ doctorName: '', clinicTitle: '', clinicLogoUrl: '', themeColor: 'rose' });
  const [patients, setPatients] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<'doctor' | 'assistant'>('doctor');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const c = THEMES[settings.themeColor] || settings.themeColor || THEMES.rose;
    document.documentElement.style.setProperty('--primary', c);
    document.documentElement.style.setProperty('--primary-fg', '#fff');
  }, [settings.themeColor]);

  const refresh = useCallback(async () => {
    try {
      const [s, p, v] = await Promise.all([j('/api/settings'), j('/api/patients'), j('/api/visits')]);
      if (!s.error) setSettings(s);
      if (Array.isArray(p)) { setPatients(p); localStorage.setItem('ova-patients', JSON.stringify(p)); }
      if (Array.isArray(v)) { setVisits(v); localStorage.setItem('ova-visits', JSON.stringify(v)); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    onUnauth = () => { setAuthed(false); setPatients([]); setVisits([]); clearCache(); };
    setRole((localStorage.getItem('ova-role') as any) || 'doctor');
    (async () => {
      const a = await j('/api/auth').catch(() => ({ ok: false }));
      if (a.ok) {
        setAuthed(true); // cached data is only read once the session cookie is confirmed
        try { setPatients(JSON.parse(localStorage.getItem('ova-patients') || '[]')); setVisits(JSON.parse(localStorage.getItem('ova-visits') || '[]')); } catch {}
        await refresh();
      } else {
        clearCache();
        const b = await j('/api/branding').catch(() => null);
        if (b && !b.error) setSettings((s: any) => ({ ...s, ...b }));
        setLoading(false);
      }
      setChecking(false);
    })();
  }, [refresh]);

  const login = async (username: string, password: string) => {
    const r = await j('/api/auth', 'POST', { username, password });
    if (r.ok) { setAuthed(true); setLoading(true); refresh(); }
    return !!r.ok;
  };
  const logout = async () => { await j('/api/auth', 'DELETE'); onUnauth(); };
  const switchRole = (r: 'doctor' | 'assistant') => { setRole(r); localStorage.setItem('ova-role', r); };
  // optimistic updates: update UI first, sync to Sheets in background
  const savePatient = async (p: any) => {
    const isNew = !p.id; const rec = { ...p, id: p.id || crypto.randomUUID() };
    setPatients((l) => (isNew ? [...l, rec] : l.map((x) => (x.id === rec.id ? { ...x, ...rec } : x))));
    await j('/api/patients', isNew ? 'POST' : 'PUT', rec);
    return rec;
  };
  const saveVisit = async (v: any) => {
    const rec = { ...v, visitId: v.visitId || crypto.randomUUID() };
    setVisits((l) => [...l.filter((x) => x.visitId !== rec.visitId), rec]);
    await j('/api/visits', v.visitId ? 'PUT' : 'POST', rec);
    return rec;
  };
  const saveSettings = async (patch: any) => { setSettings((s: any) => ({ ...s, ...patch })); await j('/api/settings', 'PUT', patch); };
  return <C.Provider value={{ settings, patients, visits, authed, checking, role, loading, login, logout, switchRole, savePatient, saveVisit, saveSettings, refresh }}>{children}</C.Provider>;
}
