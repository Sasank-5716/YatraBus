import { Directive, ElementRef, Input, inject } from '@angular/core';
import { ICONS } from './icons';

const SVG_NS = 'http://www.w3.org/2000/svg';
const cache = new Map<string, SVGSVGElement | null>();
function template(name: string) {
  if (!cache.has(name)) {
    const src = (ICONS as Record<string, string>)[name];
    cache.set(name, src?.startsWith('<svg') ? new DOMParser().parseFromString(src.replace('<svg', `<svg xmlns="${SVG_NS}"`), 'image/svg+xml').documentElement as unknown as SVGSVGElement : null);
  }
  return cache.get(name)!;
}

/**
 * Renders a static icon asset into the host <svg>: `<svg ybIcon="pin"></svg>`.
 * The asset's attributes (viewBox, size, stroke…) and shapes are cloned onto the host, so the DOM is identical to v5's inline SVG.
 */
@Directive({ selector: 'svg[ybIcon]' })
export class IconDirective {
  private el = inject(ElementRef<SVGSVGElement>).nativeElement as SVGSVGElement;
  private applied: string[] = [];
  @Input({ required: true }) set ybIcon(name: string) {
    const t = template(name);
    this.applied.forEach(a => this.el.removeAttribute(a)); this.applied = [];
    if (!t) { this.el.replaceChildren(); return; }
    for (const { name: a, value } of Array.from(t.attributes)) {
      if (a === 'xmlns') continue;
      if (a === 'class') value.split(/\s+/).forEach(c => c && this.el.classList.add(c));
      else { this.el.setAttribute(a, value); this.applied.push(a); }
    }
    this.el.replaceChildren(...Array.from(t.childNodes, n => document.importNode(n, true)));
  }
}
