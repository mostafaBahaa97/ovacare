// Client-side logo compression → data URL small enough for one Google Sheets cell (limit 50,000 chars)
const MAX_CHARS = 45000;
const jpeg = (c: HTMLCanvasElement, q: number) => {
  const o = document.createElement('canvas'); o.width = c.width; o.height = c.height;
  const x = o.getContext('2d')!; x.fillStyle = '#fff'; x.fillRect(0, 0, o.width, o.height); x.drawImage(c, 0, 0);
  return o.toDataURL('image/jpeg', q);
};
export async function compressLogo(file: File): Promise<string> {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) throw new Error('الصيغة غير مدعومة، استخدمي PNG أو JPG أو WebP');
  const bmp = await createImageBitmap(file);
  let side = 256;
  for (let i = 0; i < 6; i++, side = Math.round(side * 0.75)) {
    const r = Math.min(1, side / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bmp.width * r)); c.height = Math.max(1, Math.round(bmp.height * r));
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    for (const q of [0.9, 0.75, 0.55, 0.4]) {
      let u = c.toDataURL('image/webp', q);
      if (!u.startsWith('data:image/webp')) u = jpeg(c, q); // browsers without WebP encoding
      if (u.length <= MAX_CHARS) return u;
    }
  }
  throw new Error('تعذر تصغير الصورة بما يكفي، جرّبي صورة أبسط');
}
