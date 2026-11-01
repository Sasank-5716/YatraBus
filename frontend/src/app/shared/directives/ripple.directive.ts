import { Directive, HostListener } from '@angular/core';
import { REDUCED_MOTION } from '../../core/utils/format';

/** Material-style ripple on .btn, .chip, .pm and enabled .seat elements (event-delegated, same as v5). */
@Directive({ selector: '[ybRipple]' })
export class RippleDirective {
  @HostListener('document:pointerdown', ['$event'])
  onDown(e: PointerEvent) {
    const b = (e.target as Element).closest?.('.btn, .chip, .pm, .seat:not(:disabled)') as HTMLButtonElement | null;
    if (!b || REDUCED_MOTION || b.disabled) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2, sp = document.createElement('span');
    sp.className = 'ripple'; sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.append(sp); setTimeout(() => sp.remove(), 650);
  }
}
