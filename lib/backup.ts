import { HEAD } from './schema';
const cell = (v: any) => { let s = String(v ?? ''); if (/^[=@\t\r]|^[+\-](?!\d)/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
export const toCsv = (rows: any[], headers: readonly string[]) => '\uFEFF' + [headers.map(cell).join(','), ...rows.map((r) => headers.map((h) => cell(r[h])).join(','))].join('\r\n');
const save = (name: string, text: string, type: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
const day = () => new Date().toISOString().slice(0, 10);
export const exportCsv = (kind: 'patients' | 'visits', rows: any[]) => save(`ovacare-${kind}-${day()}.csv`, toCsv(rows, kind === 'patients' ? HEAD.Patients : HEAD.Visits), 'text/csv;charset=utf-8');
export const exportJson = (patients: any[], visits: any[]) => save(`ovacare-backup-${day()}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), patients, visits }, null, 2), 'application/json');
