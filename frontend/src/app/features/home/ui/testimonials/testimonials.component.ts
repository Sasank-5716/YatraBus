import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { TESTIMONIALS } from '../../data/home.content';
import { debounce } from '../../../../core/utils/format';
import { IconDirective } from '../../../../shared/ui/icon/icon.directive';
import { InitialsPipe } from '../../../../shared/pipes/format.pipes';

/** Reviews carousel: auto-advances every 4.5 s, pauses on hover, arrows/dots/swipe, 1–3 slides per view. */
@Component({
  selector: 'section[ybTestimonials]',
  imports: [IconDirective, InitialsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'section testi-sec', '(window:resize)': 'onResize()' },
  templateUrl: './testimonials.component.html',
})
export class TestimonialsComponent {
  protected readonly items = TESTIMONIALS;
  protected readonly index = signal(0);
  private readonly width = signal(innerWidth);
  protected readonly perView = computed(() => { const w = this.width(); return w < 760 ? 1 : w < 1100 ? 2 : 3; });
  protected readonly max = computed(() => this.items.length - this.perView());
  protected readonly transform = computed(() => `translateX(-${this.index() * (100 / this.perView())}%)`);
  private timer: ReturnType<typeof setInterval> | undefined;
  private sx: number | null = null;
  protected readonly onResize = debounce(() => { this.width.set(innerWidth); this.go(this.index()); }, 150);

  constructor() { this.go(0); this.restart(); inject(DestroyRef).onDestroy(() => clearInterval(this.timer)); }

  protected go(n: number) { const max = this.max(); this.index.set(n > max ? 0 : n < 0 ? max : n); }
  protected step(d: number) { this.go(this.index() + d); this.restart(); }
  protected pick(i: number) { this.go(i); this.restart(); }
  protected pause() { clearInterval(this.timer); }
  protected restart() { clearInterval(this.timer); this.timer = setInterval(() => this.go(this.index() + 1), 4500); }
  protected touchStart(e: TouchEvent) { this.sx = e.touches[0].clientX; }
  protected touchEnd(e: TouchEvent) {
    if (this.sx === null) return; const dx = e.changedTouches[0].clientX - this.sx;
    if (Math.abs(dx) > 40) this.step(dx < 0 ? 1 : -1); this.sx = null;
  }
}
