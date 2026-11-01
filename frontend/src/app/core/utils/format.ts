/** Pure formatting / date helpers shared by every feature (same output as v5). */
export const npr = (n: unknown) => 'Rs. ' + Math.round(Number(n) || 0).toLocaleString('en-IN');
export const dur = (m: number) => `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}`;
export const pad = (n: number) => String(n).padStart(2, '0');
export const isoLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => isoLocal(new Date());
export const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoLocal(d); };
export const fmtDate = (iso: string, o: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', o);
export const t12 = (t: string) => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`; };
export const fmtStamp = (iso: string) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
export const fmtLong = (iso: string) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
export const qs = (o: Record<string, any>) => new URLSearchParams(o).toString();
export const initials = (n: string) => String(n || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
export const gName = (g: string) => ({ M: 'Male', F: 'Female', O: 'Other' } as Record<string, string>)[g] || g;
export const ratingCls = (r: number) => r >= 4.5 ? '' : r >= 4 ? 'mid' : 'low';
export const firstName = (n: string) => n.split(' ')[0];
export function debounce<A extends unknown[]>(f: (...a: A) => void, ms = 250) { let t: any; return (...a: A) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; }
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^9[678]\d{8}$/;
export function pwStrength(pw: string) { let n = 0; if (pw.length >= 8) n++; if (pw.length >= 12) n++; if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) n++; if (/\d/.test(pw)) n++; if (/[^A-Za-z0-9]/.test(pw)) n++; return Math.min(4, n); }
export const PW_HINTS = ['At least 8 characters with letters and numbers.', 'Weak password', 'Fair password', 'Good password', 'Strong password'];
export const REDUCED_MOTION = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
