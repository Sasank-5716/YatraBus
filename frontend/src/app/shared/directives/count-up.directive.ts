import { Directive, ElementRef, Input, OnInit, inject } from '@angular/core';
import { npr } from '../../core/utils/format';

/** `<span [ybCount]="n" fmt="npr" suffix="+" [dec]="1">` — renders 0 and counts up when revealed (see motion.countUp). */
@Directive({
  selector: '[ybCount]',
  host: { '[attr.data-count]': 'ybCount', '[attr.data-fmt]': 'fmt || null', '[attr.data-dec]': 'dec || null', '[attr.data-suffix]': 'suffix || null' },
})
export class CountUpDirective implements OnInit {
  private el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  @Input({ required: true }) ybCount!: number;
  @Input() fmt?: 'npr';
  @Input() dec?: number;
  @Input() suffix?: string;
  ngOnInit() { this.el.textContent = (this.fmt === 'npr' ? npr(0) : '0') + (this.suffix || ''); }
}
