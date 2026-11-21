export const waNumber = (phone?: string) => {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('20')) return d;
  if (d.startsWith('0')) d = d.slice(1);
  return '20' + d; // 01xxxxxxxxx -> 201xxxxxxxxx
};
export const telHref = (phone?: string) => 'tel:' + String(phone || '').replace(/[^\d+]/g, '');
