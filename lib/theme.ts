export const THEMES: Record<string, string> = { rose: '#e11d74', teal: '#0d9488', blue: '#2563eb', violet: '#7c3aed', emerald: '#059669' };
export const themeHex = (v?: string) => THEMES[v || ''] || (/^#[0-9a-f]{6}$/i.test(v || '') ? (v as string) : THEMES.rose);
