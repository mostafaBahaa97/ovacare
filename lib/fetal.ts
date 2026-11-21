export type Fetus = { fhr?: string; fhrPositive?: boolean; efw?: string; presentation?: string; placenta?: string; grade?: string; liquor?: string; afi?: string; crl?: string; bpd?: string; hc?: string; ac?: string; fl?: string; note?: string };
export const parseFetal = (s: any): Fetus[] => { try { const a = JSON.parse(s); return Array.isArray(a) && a.length ? a : [{}]; } catch { return [{}]; } };
export const fhrAbnormal = (n: number) => n > 0 && (n < 110 || n > 160);
const PRES: any = { cephalic: 'رأسي', breech: 'مقعدي', transverse: 'عرضي' };
export const fetalSummary = (fs: Fetus[]) => fs.map((x) => [x.fhr ? `FHR: ${x.fhr}` : x.fhrPositive ? 'FHR: +ve' : '', x.efw ? `EFW: ${+(+x.efw / 1000).toFixed(2)}kg` : '', PRES[x.presentation || ''] || ''].filter(Boolean).join(' | ')).filter(Boolean).join(' • ');
export const gaWeeks = (s?: string) => { const m = /(\d+)\s*Weeks?\s*\+\s*(\d+)/i.exec(s || ''); return m ? +m[1] + +m[2] / 7 : null; };
