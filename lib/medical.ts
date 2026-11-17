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
