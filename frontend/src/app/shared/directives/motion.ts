/* Scroll-reveal engine (v5 FX rules): tags matching elements with data-fx + a stagger index, reveals them via IntersectionObserver. */
import { npr, REDUCED_MOTION } from '../../core/utils/format';

type Fx = 'up' | 'down' | 'left' | 'right' | 'zoom' | 'fade' | 'alt';
export const FX_RULES: [string, Fx][] = [
  ['.section-head', 'up'], ['.offer', 'zoom'], ['.route-card', 'alt'], ['.feature', 'up'], ['.faq details', 'up'], ['.testi-wrap', 'up'], ['.dots', 'fade'],
  ['.trust-item', 'up'], ['.logos', 'fade'], ['.news-card', 'zoom'], ['.bus-card', 'up'], ['.date-strip button', 'down'], ['.sortbar', 'fade'],
  ['.ticket', 'up'], ['.notify > *', 'alt'], ['.success-hero', 'zoom'], ['.stat-mini', 'zoom'], ['.booking-row', 'left'], ['.acc-tabs', 'fade'],
  ['.deck', 'zoom'], ['.legend', 'fade'], ['.summary', 'right'], ['.pax', 'up'], ['.leg-sum', 'left'], ['.stat', 'zoom'], ['.chart', 'up'], ['.side', 'left'],
  ['.table-wrap tbody tr', 'fade'], ['.empty', 'zoom'], ['.login-box', 'zoom'], ['.route-bar h1', 'left'], ['.steps', 'right'],
  ['.footer-grid > div', 'up'], ['.footer-bottom', 'fade'], ['.ticks li', 'left'], ['.store', 'up'], ['.socials a', 'zoom'], ['.card', 'up'],
];
const all = (sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<HTMLElement>(sel));

const fxIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; const el = e.target as HTMLElement; fxIO!.unobserve(el);
  requestAnimationFrame(() => el.classList.add('fx-in'));
  const delay = parseFloat(getComputedStyle(el).transitionDelay) * 1000 || 0;
  setTimeout(() => el.classList.add('fx-done'), 1000 + delay);
  all('[data-count]', el).forEach(countUp); if (el.dataset['count']) countUp(el);
}), { rootMargin: '0px 0px -40px 0px', threshold: 0 }) : null;

/** Tag + observe every not-yet-enhanced element under root. Idempotent; called after each render. */
export function enhance(root: ParentNode = document) {
  const counts = new Map<Element, number>();
  for (const [sel, type] of FX_RULES) {
    all(sel, root).forEach(el => {
      if (el.dataset['fx'] || el.closest('.modal, .toasts, .filters, .dropdown')) return;
      if (el.parentElement!.closest('[data-fx]:not(.fx-done)') && !sel.startsWith('.footer')) return; // parent already animating
      const p = staggerParent(el), i = counts.get(p) || 0; counts.set(p, i + 1);
      el.dataset['fx'] = type === 'alt' ? (i % 2 ? 'right' : 'left') : type;
      el.style.setProperty('--i', String(Math.min(i, 10)));
    });
  }
  all('[data-fx]:not(.fx-in)', root).forEach(el => { if (el.dataset['fxObs']) return; el.dataset['fxObs'] = '1'; if (fxIO) fxIO.observe(el); else el.classList.add('fx-in', 'fx-done'); });
  all('[data-count]', root).forEach(el => {
    if (el.closest('[data-fx]:not(.fx-in)')) return;
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) countUp(el); else if (fxIO && !el.dataset['fxObs']) { el.dataset['fxObs'] = '1'; fxIO.observe(el); }
  });
}
/** Stagger siblings by their layout parent: component hosts with display:contents are skipped so indexes match v5. */
function staggerParent(el: HTMLElement): Element {
  let p = el.parentElement!;
  while (p.parentElement && p.tagName.includes('-') && getComputedStyle(p).display === 'contents') p = p.parentElement;
  return p;
}

/** Animate a [data-count] element from 0 to its target (format: data-fmt="npr", data-dec, data-suffix). */
export function countUp(el: HTMLElement) {
  if (el.dataset['counted']) return; el.dataset['counted'] = '1';
  const target = Number(el.dataset['count']), fmt = el.dataset['fmt'], dec = Number(el.dataset['dec'] || 0), suf = el.dataset['suffix'] || '';
  const show = (v: number) => el.textContent = (fmt === 'npr' ? npr(v) : dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-IN')) + suf;
  const t0 = performance.now(), D = REDUCED_MOTION ? 500 : 1400;
  const step = (t: number) => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); show(target * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
