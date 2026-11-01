import { ChangeDetectionStrategy, Component, afterNextRender } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from './core/layout/site-header.component';
import { SiteFooterComponent } from './core/layout/site-footer.component';
import { initChromeFx } from './core/layout/chrome-fx';
import { ModalHostComponent } from './shared/ui/modal/modal-host.component';
import { ToastHostComponent } from './shared/ui/toast/toast-host.component';
import { RippleDirective } from './shared/directives/ripple.directive';
import { HoverTiltDirective } from './shared/directives/hover-tilt.directive';
import { RevealOnScrollDirective } from './shared/directives/reveal-on-scroll.directive';

/** App shell: header, routed page in #main, footer, toasts and the modal slot (same chrome markup as v5 index.html). */
@Component({
  selector: 'yb-root',
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent, ModalHostComponent, ToastHostComponent, RevealOnScrollDirective],
  hostDirectives: [RippleDirective, HoverTiltDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  constructor() { afterNextRender(() => initChromeFx()); }
}
