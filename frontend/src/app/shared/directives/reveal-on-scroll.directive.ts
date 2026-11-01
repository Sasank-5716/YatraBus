import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { enhance } from './motion';
import { debounce } from '../../core/utils/format';

/** Scroll-reveal for everything rendered inside the host (#main): re-runs the FX rules whenever the DOM changes. */
@Directive({ selector: '[ybReveal]' })
export class RevealOnScrollDirective implements OnInit, OnDestroy {
  private host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private mo?: MutationObserver;
  ngOnInit() {
    this.mo = new MutationObserver(debounce(() => enhance(document), 30));
    this.mo.observe(this.host, { childList: true, subtree: true });
  }
  ngOnDestroy() { this.mo?.disconnect(); }
}
