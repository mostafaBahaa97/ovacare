// Clinic-wide .xlsx export. exceljs is loaded lazily (browser UMD bundle: no Node polyfills, works offline).
import { activePregnancy, daysToEdd, fmtDate, todayLocal, isoDay, gaAr, TRI_AR, DELIVERY_AR, yesNo, gpaText } from './medical';
import { parseFetal, fetalLines } from './fetal';
import { themeHex } from './theme';
type Col = { h: string; t?: 'phone' | 'date' | 'bp'; c?: boolean; max?: number };
const tint = (c: string, t: number) => [1, 3, 5].map((i) => { const v = parseInt(c.slice(i, i + 2), 16); return Math.round(v + (255 - v) * t).toString(16).padStart(2, '0'); }).join('').toUpperCase();
const xlDate = (iso?: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; };
const edge: any = { style: 'thin', color: { argb: 'FFE2E8F0' } };
const border: any = { top: edge, left: edge, bottom: edge, right: edge };
const solid = (argb: string): any => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + argb } });

function table(wb: any, name: string, cols: Col[], rows: any[][], color: string) {
  const ws = wb.addWorksheet(name, { views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }] });
  ws.addRow(cols.map((c) => c.h)); rows.forEach((r) => ws.addRow(r));
  const widths = cols.map((c, i) => {
    const longest = Math.max(Math.min(c.h.length, 16), ...rows.map((r) => Math.max(0, ...String(r[i] instanceof Date ? '00/00/0000' : r[i] ?? '').split('\n').map((x) => x.length))));
    return Math.min(Math.max(Math.ceil(longest * 1.15) + 3, 8), c.max || 40);
  });
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  ws.eachRow((row: any, n: number) => {
    let lines = 1;
    row.eachCell({ includeEmpty: true }, (cell: any, ci: number) => {
      const col = cols[ci - 1]; if (!col) return;
      cell.border = border;
      if (n === 1) { cell.fill = solid(color.slice(1).toUpperCase()); cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 }; cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; }
      else {
        cell.alignment = { vertical: 'top', horizontal: col.c ? 'center' : 'right', wrapText: true };
        if (n % 2 === 0) cell.fill = solid(tint(color, 0.92));
        if (col.t === 'phone' || col.t === 'bp') cell.numFmt = '@'; // keep leading zeros / avoid date coercion
        if (col.t === 'date') cell.numFmt = 'dd/mm/yyyy';
      }
      const txt = cell.value instanceof Date ? '00/00/0000' : String(cell.value ?? '');
      lines = Math.max(lines, txt.split('\n').reduce((a, l) => a + Math.max(1, Math.ceil(l.length / (widths[ci - 1] * 0.9))), 0));
    });
    row.height = n === 1 ? 28 : Math.min(Math.max(20, lines * 15 + 4), 320);
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
}

export async function exportClinicExcel({ patients, visits, settings, includePrivate }: { patients: any[]; visits: any[]; settings: any; includePrivate: boolean }) {
  const mod: any = await import('exceljs/dist/exceljs.min.js');
  const wb = new (mod.default ?? mod).Workbook(); wb.creator = 'OvaCare'; wb.created = new Date();
  const color = themeHex(settings?.themeColor);
  const pts = patients.filter((p) => p.name).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  const byId = new Map(pts.map((p) => [p.id, p]));
  const vOf = new Map<string, any[]>();
  [...visits].sort((a, b) => String(a.visitDate).localeCompare(String(b.visitDate))).forEach((v) => vOf.set(v.patientId, [...(vOf.get(v.patientId) || []), v]));
  const today = fmtDate(todayLocal());

  // ---- Sheet 1: summary ----
  const actives = pts.map((p) => ({ p, g: activePregnancy(p.lmpDate) })).filter((x) => x.g) as { p: any; g: NonNullable<ReturnType<typeof activePregnancy>> }[];
  const due = actives.filter((x) => x.g.weeks >= 36).sort((a, b) => a.g.edd.getTime() - b.g.edd.getTime());
  const s1 = wb.addWorksheet('ملخص العيادة', { views: [{ rightToLeft: true, showGridLines: false }] });
  [6, 30, 18, 20, 20, 18].forEach((w, i) => (s1.getColumn(i + 1).width = w));
  const banner = (row: number, text: string, size: number, bold = true, argb = color.slice(1).toUpperCase()) => { s1.mergeCells(`A${row}:F${row}`); const c = s1.getCell(`A${row}`); c.value = text; c.font = { size, bold, color: { argb: 'FF' + argb } }; c.alignment = { horizontal: 'right', vertical: 'middle' }; s1.getRow(row).height = size + 12; };
  banner(1, settings?.doctorName || 'OvaCare', 20); banner(2, settings?.clinicTitle || '', 13, false, '475569'); banner(3, `تاريخ التصدير: ${today}`, 11, false, '475569');
  banner(5, 'مؤشرات العيادة', 14);
  ([['إجمالي المريضات', pts.length], ['إجمالي الزيارات', visits.length], ['حالات الحمل الحالية', actives.length], ['قريبات الولادة (36–44 أسبوع)', due.length]] as [string, number][]).forEach(([k, v], i) => {
    const r = 6 + i; const a = s1.getCell(`B${r}`), b = s1.getCell(`C${r}`);
    a.value = k; b.value = v; a.alignment = { horizontal: 'right', vertical: 'middle' }; b.alignment = { horizontal: 'center', vertical: 'middle' }; b.font = { bold: true, size: 14, color: { argb: 'FF' + color.slice(1).toUpperCase() } };
    [a, b].forEach((c) => { c.fill = solid(tint(color, 0.9)); c.border = border; }); s1.getRow(r).height = 24;
  });
  banner(11, 'الحالات قريبة الولادة (الشهر التاسع)', 14);
  ['م', 'اسم المريضة', 'رقم الهاتف', 'أسبوع الحمل', 'تاريخ الولادة المتوقع', 'الأيام المتبقية'].forEach((h, i) => { const c = s1.getCell(12, i + 1); c.value = h; c.fill = solid(color.slice(1).toUpperCase()); c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; c.border = border; });
  s1.getRow(12).height = 26;
  if (!due.length) { s1.mergeCells('A13:F13'); const c = s1.getCell('A13'); c.value = 'لا توجد حالات قريبة الولادة حالياً'; c.alignment = { horizontal: 'center' }; c.font = { color: { argb: 'FF64748B' } }; }
  due.forEach(({ p, g }, i) => {
    const d = daysToEdd(g);
    [i + 1, p.name, p.phone || '', `${g.weeks} أسبوع + ${g.days} يوم`, xlDate(isoDay(g.edd)), d >= 0 ? d : `متأخرة ${-d} يوم`].forEach((v, j) => {
      const c = s1.getCell(13 + i, j + 1); c.value = v as any; c.border = border; c.alignment = { horizontal: j === 1 ? 'right' : 'center', vertical: 'middle' };
      if (j === 2) c.numFmt = '@'; if (j === 4) c.numFmt = 'dd/mm/yyyy'; if (i % 2) c.fill = solid(tint(color, 0.92));
    });
  });

  // ---- Sheet 2: patients ----
  const pc: Col[] = [{ h: 'م', c: true }, { h: 'اسم المريضة' }, { h: 'رقم الهاتف', t: 'phone', c: true }, { h: 'السن', c: true }, { h: 'حالة الحمل الحالية' }, { h: 'تاريخ الولادة المتوقع', t: 'date', c: true }, { h: 'أول حمل؟', c: true }, { h: 'التاريخ الإنجابي (GPA)' }, { h: 'نوع الولادة السابقة' }, { h: 'حساسية الأدوية', max: 40 }, { h: 'الأمراض المزمنة', max: 40 }, { h: 'الأدوية الدائمة', max: 40 }, { h: 'التاريخ الوراثي', max: 40 }, { h: 'تاريخ تشوهات أجنة', max: 40 }, { h: 'عدد الزيارات', c: true }, { h: 'تاريخ آخر زيارة', t: 'date', c: true }, { h: 'المطلوب للزيارة القادمة', max: 48 }];
  if (includePrivate) pc.push({ h: 'ملاحظات الدكتورة الخاصة', max: 48 });
  table(wb, 'سجل المريضات', pc, pts.map((p, i) => {
    const vs = vOf.get(p.id) || []; const last = vs[vs.length - 1]; const g = activePregnancy(p.lmpDate);
    const row: any[] = [i + 1, p.name, p.phone || '', p.age ? +p.age || p.age : '', g ? `حامل — الأسبوع ${g.weeks} + ${g.days} (الثلث ${TRI_AR[g.trimester]})` : '', g ? xlDate(isoDay(g.edd)) : null, yesNo(p.isFirstPregnancy), gpaText(p), DELIVERY_AR[p.previousDeliveryType] || '', p.drugAllergies || '', p.chronicDiseases || '', p.regularMedications || '', p.familyHistory || '', p.fetalAnomaliesHistory || '', vs.length, last ? xlDate(last.visitDate) : null, last?.nextVisitRequests || ''];
    if (includePrivate) row.push(p.privateNotes || ''); return row;
  }), color);

  // ---- Sheet 3: visits, newest first, linked by name/phone ----
  const vc: Col[] = [{ h: 'م', c: true }, { h: 'تاريخ الزيارة', t: 'date', c: true }, { h: 'اسم المريضة' }, { h: 'رقم الهاتف', t: 'phone', c: true }, { h: 'عمر الحمل وقت الزيارة', c: true }, { h: 'الوزن (كجم)', c: true }, { h: 'ضغط الدم', t: 'bp', c: true }, { h: 'متابعة الجنين', max: 55 }, { h: 'التشخيص والملاحظات', max: 48 }, { h: 'الأدوية الموصوفة', max: 40 }, { h: 'طلبات الزيارة القادمة', max: 40 }];
  if (includePrivate) vc.push({ h: 'ملاحظة خاصة للزيارة', max: 48 });
  table(wb, 'سجل الزيارات والمتابعة', vc, [...visits].sort((a, b) => String(b.visitDate).localeCompare(String(a.visitDate))).map((v, i) => {
    const p = byId.get(v.patientId); const w = v.weight !== '' && v.weight != null && Number.isFinite(+v.weight) ? +v.weight : v.weight || '';
    const row: any[] = [i + 1, xlDate(v.visitDate), p?.name || '—', p?.phone || '', gaAr(v.gestationalAgeAtVisit), w, v.bloodPressureSys ? `${v.bloodPressureSys}/${v.bloodPressureDia || '—'}` : '', fetalLines(parseFetal(v.fetalData)).join('\n'), v.diagnosisNotes || '', v.prescribedMedications || '', v.nextVisitRequests || ''];
    if (includePrivate) row.push(v.privateVisitNote || ''); return row;
  }), color);

  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a'); a.href = url; a.download = `OvaCare_سجل_العيادة_${todayLocal()}.xlsx`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
