import { google } from 'googleapis';
import { HEAD } from './schema';
export { HEAD };
export type Tab = keyof typeof HEAD;
export const KEY: Record<Tab, string> = { Settings: 'key', Patients: 'id', Visits: 'visitId' };
export const DEFAULT_SETTINGS: Record<string, string> = {
  username: 'fatima', password: 'fatimasalama', doctorName: 'د. فاطمة سلامة',
  clinicTitle: 'عيادة النساء والتوليد والحقن المجهري', clinicLogoUrl: '', themeColor: 'rose',
  sectionOrder: JSON.stringify({ order: ['basic','history','chart','visit','private'], collapsed: {} }),
};
const api = () => google.sheets({ version: 'v4', auth: new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL, key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'] }) });
const sid = () => process.env.GOOGLE_SHEET_ID!;
let ready = false;
async function init() {
  if (ready) return;
  const s = api();
  const m = await s.spreadsheets.get({ spreadsheetId: sid() });
  const have = (m.data.sheets || []).map((x) => x.properties?.title);
  const add = (Object.keys(HEAD) as Tab[]).filter((t) => !have.includes(t));
  if (add.length) await s.spreadsheets.batchUpdate({ spreadsheetId: sid(), requestBody: { requests: add.map((title) => ({ addSheet: { properties: { title } } })) } });
  for (const t of add) await s.spreadsheets.values.update({ spreadsheetId: sid(), range: `${t}!A1`, valueInputOption: 'RAW', requestBody: { values: [[...HEAD[t]]] } });
  // backward compat: append any missing header (e.g. Visits.fetalData) without touching existing rows
  for (const t of (Object.keys(HEAD) as Tab[]).filter((x) => !add.includes(x))) {
    const have: string[] = ((await s.spreadsheets.values.get({ spreadsheetId: sid(), range: `${t}!A1:Z1` })).data.values?.[0] as string[]) || [];
    for (const h of HEAD[t]) {
      if (have.includes(h)) continue;
      await s.spreadsheets.values.update({ spreadsheetId: sid(), range: `${t}!${String.fromCharCode(65 + have.length)}1`, valueInputOption: 'RAW', requestBody: { values: [[h]] } });
      have.push(h);
    }
  }
  ready = true;
}
export async function list(t: Tab) {
  await init();
  const r = await api().spreadsheets.values.get({ spreadsheetId: sid(), range: `${t}!A2:Z` });
  return (r.data.values || []).map((row, i) => ({ ...Object.fromEntries(HEAD[t].map((h, j) => [h, row[j] ?? ''])), _row: i + 2 })).filter((r: any) => r[KEY[t]]);
}
const toRow = (t: Tab, o: any) => HEAD[t].map((h) => (o[h] === undefined || o[h] === null ? '' : String(o[h])));
export async function create(t: Tab, o: any) {
  await init();
  await api().spreadsheets.values.append({ spreadsheetId: sid(), range: `${t}!A1`, valueInputOption: 'RAW', requestBody: { values: [toRow(t, o)] } });
  return o;
}
export async function update(t: Tab, keyVal: string, patch: any) {
  const row: any = (await list(t)).find((r: any) => r[KEY[t]] === keyVal);
  if (!row) throw new Error('not found');
  const merged = { ...row, ...patch, [KEY[t]]: keyVal };
  await api().spreadsheets.values.update({ spreadsheetId: sid(), range: `${t}!A${row._row}`, valueInputOption: 'RAW', requestBody: { values: [toRow(t, merged)] } });
  return merged;
}
export async function remove(t: Tab, keyVal: string) {
  const row: any = (await list(t)).find((r: any) => r[KEY[t]] === keyVal);
  if (row) await api().spreadsheets.values.clear({ spreadsheetId: sid(), range: `${t}!A${row._row}:Z${row._row}` });
}
export async function getSettings() {
  try { const m = Object.fromEntries((await list('Settings')).map((r: any) => [r.key, r.value])); return { ...DEFAULT_SETTINGS, ...m }; }
  catch { return { ...DEFAULT_SETTINGS }; }
}
export async function setSettings(patch: Record<string, string>) {
  const cur = await list('Settings');
  for (const [k, v] of Object.entries(patch)) cur.find((r: any) => r.key === k) ? await update('Settings', k, { value: v }) : await create('Settings', { key: k, value: v });
}

// Idempotent batch: upsert by UUID (update row if it exists, else append); one read per tab + one write per kind.
export async function applyBatch(ops: any[]) {
  await init();
  const TAB: Record<string, Tab> = { patient: 'Patients', visit: 'Visits', settings: 'Settings' };
  const rows: Partial<Record<Tab, Map<string, number>>> = {};
  const data: any[] = [], clears: string[] = [], results: any[] = [];
  const app: Record<Tab, any[][]> = { Patients: [], Visits: [], Settings: [] };
  const map = async (t: Tab) => (rows[t] ||= new Map((await list(t)).map((r: any) => [r[KEY[t]], r._row] as [string, number])));
  const upsert = async (t: Tab, rec: any) => {
    const key = String(rec[KEY[t]] || ''); if (!key) throw new Error('missing id');
    const m = await map(t); const row = m.get(key);
    if (row === undefined) { app[t].push(toRow(t, rec)); m.set(key, -1); }
    else if (row === -1) app[t][app[t].findIndex((r) => r[0] === key)] = toRow(t, rec);
    else data.push({ range: `${t}!A${row}`, values: [toRow(t, rec)] });
  };
  const del = async (t: Tab, key: string) => {
    const m = await map(t); const row = m.get(key);
    if (row && row > 0) clears.push(`${t}!A${row}:Z${row}`); else if (row === -1) app[t] = app[t].filter((r) => r[0] !== key);
    m.delete(key);
  };
  for (const op of ops) {
    try {
      const t = TAB[op?.entity];
      if (!t || !['upsert', 'delete'].includes(op.action) || !op.payload || typeof op.payload !== 'object') throw new Error('invalid op');
      if (t === 'Settings') { for (const [k, v] of Object.entries(op.payload)) if (k in DEFAULT_SETTINGS) await upsert(t, { key: k, value: v }); }
      else if (op.action === 'delete') await del(t, String(op.payload[KEY[t]] || ''));
      else await upsert(t, op.payload);
      results.push({ id: op.id, ok: true });
    } catch (e: any) { results.push({ id: op?.id, ok: false, error: String(e.message || e) }); }
  }
  try {
    const s = api();
    if (data.length) await s.spreadsheets.values.batchUpdate({ spreadsheetId: sid(), requestBody: { valueInputOption: 'RAW', data } });
    for (const t of Object.keys(app) as Tab[]) if (app[t].length) await s.spreadsheets.values.append({ spreadsheetId: sid(), range: `${t}!A1`, valueInputOption: 'RAW', requestBody: { values: app[t] } });
    if (clears.length) await s.spreadsheets.values.batchClear({ spreadsheetId: sid(), requestBody: { ranges: clears } });
  } catch (e: any) { return results.map((r) => ({ ...r, ok: false, error: 'Sheets: ' + String(e.message || e) })); }
  return results;
}
