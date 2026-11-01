/* Page chrome effects (v5 fx.js): sticky header shadow, scroll progress, back-to-top, batched parallax,
   page loader, and pausing infinite animations in off-screen sections. Driven by `yb:route` from PageFxService. */
export function initChromeFx() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector<HTMLElement>('.site-header')!, bar = document.getElementById('progress')!, top = document.getElementById('totop')!;
  let ticking = false, pEls: HTMLElement[] = [], lastSc: boolean | null = null, lastSh: boolean | null = null, docH = 0;
  const measure = () => { docH = document.documentElement.scrollHeight - innerHeight; };
  new ResizeObserver(measure).observe(document.body);
  const collect = () => { pEls = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]')); };
  function onScroll() {
    const y = scrollY, h = docH;
    const sc = y > 24; if (sc !== lastSc) { header.classList.toggle('scrolled', sc); lastSc = sc; }
    bar.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h) : 0})`;
    const sh = y > 600; if (sh !== lastSh) { top.classList.toggle('show', sh); lastSh = sh; }
    if (!reduced && pEls.length) {
      const vh = innerHeight, reads = pEls.map(el => el.parentElement!.getBoundingClientRect());
      for (let i = 0; i < pEls.length; i++) {
        const r = reads[i]; if (r.bottom < -200 || r.top > vh + 200) continue;
        const k = parseFloat(pEls[i].dataset['parallax'] || '') || 0, off = (r.top + r.height / 2 - vh / 2) * -k;
        pEls[i].style.transform = `translate3d(0,${off.toFixed(1)}px,0)`;
      }
    }
    ticking = false;
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', () => { measure(); req(); });
  document.addEventListener('yb:route', () => { collect(); measure(); req(); });
  top.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  const loader = document.getElementById('loader'), t0 = performance.now();
  const hide = () => { if (!loader || loader.classList.contains('done')) return; setTimeout(() => { loader.classList.add('done'); setTimeout(() => loader.remove(), 700); }, Math.max(0, 450 - (performance.now() - t0))); };
  document.addEventListener('yb:route', hide, { once: true }); setTimeout(hide, 2500);
  const animIO = new IntersectionObserver(es => es.forEach(en => en.target.classList.toggle('anim-off', !en.isIntersecting)), { rootMargin: '100px 0px' });
  const watched = new WeakSet<Element>();
  const watch = () => document.querySelectorAll('.hero, .trust-bar, .app-sec, .testi-sec, .account-hero').forEach(el => { if (!watched.has(el)) { watched.add(el); animIO.observe(el); } });
  document.addEventListener('yb:route', () => { watch(); measure(); });
  watch(); measure(); collect(); onScroll();
}
