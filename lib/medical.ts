export function pregnancy(lmp?: string) {
  if (!lmp) return null;
  const start = new Date(lmp).getTime();
  const d = Math.floor((Date.now() - start) / 864e5);
  if (isNaN(d) || d < 0) return null;
  const weeks = Math.floor(d / 7);
  return { weeks, days: d % 7, trimester: weeks < 14 ? 1 : weeks < 28 ? 2 : 3, edd: new Date(start + 280 * 864e5) };
}
export const gaText = (p: ReturnType<typeof pregnancy>) => (p ? `${p.weeks} Weeks + ${p.days} Days` : '');
export const abnormalBP = (s: number, d: number) => s >= 140 || d >= 90;
// ---- formatting helpers shared by the Excel export and the A4 report ----
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
export const fmtDate = (d?: string | Date | null) => { if (!d) return ''; const s = d instanceof Date ? (isNaN(+d) ? '' : isoDay(d)) : String(d).slice(0, 10); const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; };
export const todayLocal = () => { const x = new Date(); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
export const gaAr = (s?: string) => { const m = /(\d+)\s*Weeks?\s*\+\s*(\d+)/i.exec(s || ''); return m ? `${m[1]} أسبوع + ${m[2]} يوم` : s || ''; };
export const TRI_AR = ['', 'الأول', 'الثاني', 'الثالث'];
export const DELIVERY_AR: Record<string, string> = { Normal: 'ولادة طبيعية', 'C-Section': 'قيصرية', None: 'لا يوجد' };
export const yesNo = (v: any) => (v === true || v === 'true' ? 'نعم' : v === false || v === 'false' ? 'لا' : '—');
export const gpaText = (p: any) => (['gravida', 'para', 'abortus'].some((k) => p[k] !== undefined && p[k] !== '' && p[k] !== null) ? `حمل: ${+p.gravida || 0} | ولادة: ${+p.para || 0} | إجهاض: ${+p.abortus || 0}` : '—');
// active pregnancy = LMP within the last 44 weeks (older LMPs are treated as past pregnancies)
export const activePregnancy = (lmp?: string) => { const g = pregnancy(lmp); return g && g.weeks <= 44 ? g : null; };
export const daysToEdd = (g: { edd: Date }) => Math.ceil((g.edd.getTime() - Date.now()) / 864e5);
