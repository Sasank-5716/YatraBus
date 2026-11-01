import { Directive, HostListener } from '@angular/core';
import { REDUCED_MOTION } from '../../core/utils/format';

/** 3D tilt + moving shine for [data-tilt] cards and the --mx/--my spotlight on cards (rAF-throttled, as in v5 fx.js). */
@Directive({ selector: '[ybHoverTilt]' })
export class HoverTiltDirective {
  private pe: PointerEvent | null = null; private tick = false;
  @HostListener('document:pointermove', ['$event'])
  onMove(e: PointerEvent) { this.pe = e; if (!this.tick) { this.tick = true; requestAnimationFrame(() => this.apply()); } }
  private apply() {
    this.tick = false; const e = this.pe; if (!e) return;
    const t = (e.target as Element).closest?.('[data-tilt], .route-card, .bus-card, .feature, .stat, .trust-item, .testi') as HTMLElement | null;
    if (!t) return;
    const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    t.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); t.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    if (t.hasAttribute('data-tilt') && !REDUCED_MOTION && e.pointerType === 'mouse') t.style.transform = `perspective(800px) rotateX(${((0.5 - y) * 12).toFixed(2)}deg) rotateY(${((x - 0.5) * 14).toFixed(2)}deg) translateY(-6px) scale(1.02)`;
  }
  @HostListener('document:pointerout', ['$event'])
  onOut(e: PointerEvent) {
    const t = (e.target as Element).closest?.('[data-tilt]') as HTMLElement | null;
    if (t && !t.contains(e.relatedTarget as Node)) t.style.transform = '';
  }
}
