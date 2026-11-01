import { Injectable, Injector, afterNextRender, inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';
import { REDUCED_MOTION, wait } from '../utils/format';
import { enhance } from '../../shared/directives/motion';

/**
 * Page transition lifecycle (v5 router() semantics):
 * leave() fades the current page out before a navigation activates; ready() runs once a page has rendered its data —
 * scroll to top (or #anchor), apply scroll-reveal, and emit `yb:route` for the chrome (loader, parallax, anim pausing).
 */
@Injectable({ providedIn: 'root' })
export class PageFxService {
  private router = inject(Router);
  private get main() { return document.getElementById('main'); }

  constructor() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) this.main?.classList.remove('leaving');
    });
  }
  async leave() {
    const main = this.main;
    if (!main || !main.querySelector(':scope > :not(router-outlet)')) return; // first render: nothing to fade
    main.classList.add('leaving');
    await wait(REDUCED_MOTION ? 80 : 200);
  }
  ready(injector: Injector) {
    afterNextRender({ read: () => this.settle() }, { injector });
  }
  /** Re-run the current route (fresh component), like v5 rerender(). */
  reload() { return this.router.navigateByUrl(this.router.url, { onSameUrlNavigation: 'reload' }); }

  private settle() {
    const anchor = this.router.parseUrl(this.router.url).fragment;
    if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }), 50);
    else window.scrollTo({ top: 0, behavior: 'instant' });
    enhance();
    document.dispatchEvent(new Event('yb:route'));
  }
}
