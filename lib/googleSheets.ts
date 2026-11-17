import { google } from 'googleapis';
export const HEAD = {
  Settings: ['key', 'value'],
  Patients: ['id','name','phone','age','chronicDiseases','familyHistory','drugAllergies','regularMedications','isFirstPregnancy','gravida','para','abortus','previousDeliveryType','fetalAnomaliesHistory','lmpDate','privateNotes','createdAt','updatedAt'],
  Visits: ['visitId','patientId','visitDate','weight','bloodPressureSys','bloodPressureDia','gestationalAgeAtVisit','diagnosisNotes','prescribedMedications','nextVisitRequests','privateVisitNote'],
} as const;
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
