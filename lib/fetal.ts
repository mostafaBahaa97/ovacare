export type Fetus = { fhr?: string; fhrPositive?: boolean; efw?: string; presentation?: string; placenta?: string; grade?: string; liquor?: string; afi?: string; crl?: string; bpd?: string; hc?: string; ac?: string; fl?: string; note?: string };
export const parseFetal = (s: any): Fetus[] => { try { const a = JSON.parse(s); return Array.isArray(a) && a.length ? a : [{}]; } catch { return [{}]; } };
export const fhrAbnormal = (n: number) => n > 0 && (n < 110 || n > 160);
const PRES: any = { cephalic: 'رأسي', breech: 'مقعدي', transverse: 'عرضي' };
export const fetalSummary = (fs: Fetus[]) => fs.map((x) => [x.fhr ? `FHR: ${x.fhr}` : x.fhrPositive ? 'FHR: +ve' : '', x.efw ? `EFW: ${+(+x.efw / 1000).toFixed(2)}kg` : '', PRES[x.presentation || ''] || ''].filter(Boolean).join(' | ')).filter(Boolean).join(' • ');
export const gaWeeks = (s?: string) => { const m = /(\d+)\s*Weeks?\s*\+\s*(\d+)/i.exec(s || ''); return m ? +m[1] + +m[2] / 7 : null; };
const PRES_AR: Record<string, string> = { cephalic: 'رأسي (Cephalic)', breech: 'مقعدي (Breech)', transverse: 'عرضي (Transverse)' };
const PLAC_AR: Record<string, string> = { anterior: 'أمامية', posterior: 'خلفية', previa: 'منخفضة (Previa)' };
const LIQ_AR: Record<string, string> = { normal: 'طبيعي', low: 'ناقص', high: 'زائد' };
// Readable Arabic, one line per fetus (twins get "جنين N:" prefixes)
export function fetalLines(fs: Fetus[]): string[] {
  const multi = fs.length > 1;
  return fs.map((x, i) => {
    const a: string[] = [];
    if (x.fhr) a.push(`نبض ${x.fhr} bpm`); else if (x.fhrPositive) a.push('نبض موجب (+ve)');
    if (x.efw) a.push(`وزن تقديري ${+(+x.efw / 1000).toFixed(2)} كجم`);
    if (x.presentation) a.push(PRES_AR[x.presentation] || x.presentation);
    if (x.placenta || x.grade) a.push(`مشيمة ${PLAC_AR[x.placenta || ''] || ''}${x.grade ? ` (Grade ${x.grade})` : ''}`.replace('  ', ' ').trim());
    if (x.liquor || x.afi) a.push(`سائل ${LIQ_AR[x.liquor || ''] || ''}${x.afi ? ` (AFI ${x.afi})` : ''}`.replace('  ', ' ').trim());
    const bio = ([['CRL', x.crl], ['BPD', x.bpd], ['HC', x.hc], ['AC', x.ac], ['FL', x.fl]] as [string, string | undefined][]).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`);
    if (bio.length) a.push('مقاسات: ' + bio.join(' / '));
    if (x.note) a.push(`ملاحظة: ${x.note}`);
    return a.length ? (multi ? `جنين ${i + 1}: ` : '') + a.join(' | ') : '';
  }).filter(Boolean);
}
