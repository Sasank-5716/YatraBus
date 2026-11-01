import type { Booking } from '../../core/models/api.models';

/** Save the rendered ticket (+ fare card) as a standalone HTML file with the page's CSS inlined. */
export function downloadTicket(b: Booking, root: HTMLElement) {
  const css = Array.from(document.styleSheets).map(s => { try { return Array.from(s.cssRules).map(r => r.cssText).join('\n'); } catch { return ''; } }).join('\n');
  const parts = Array.from(root.querySelectorAll('.ticket, [ybFareDetails]'), el => el.outerHTML).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Yatra Bus ticket ${b.id}</title><style>${css}</style></head><body style="padding:24px;background:#fff"><div style="max-width:900px;margin:auto">${parts}</div></body></html>`;
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); a.download = `YatraBus-${b.id}.html`;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
