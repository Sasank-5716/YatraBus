import { ChangeDetectionStrategy, Component, Injector, inject, signal, viewChild } from '@angular/core';
import { MetaStore } from '../../core/state/meta.store';
import { ToastService } from '../../core/services/toast.service';
import { PageFxService } from '../../core/routing/page-fx.service';
import type { Meta, Popular } from '../../core/models/api.models';
import { initials } from '../../core/utils/format';
import { IconDirective } from '../../shared/ui/icon/icon.directive';
import { QrComponent } from '../../shared/ui/qr/qr.component';
import { CountUpDirective } from '../../shared/directives/count-up.directive';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { DurPipe, NprPipe } from '../../shared/pipes/format.pipes';
import { SceneBusComponent, SceneFarComponent, SceneMidComponent, SceneNearComponent } from './ui/scene/hero-scene.components';
import { SearchFormComponent } from './ui/search-form/search-form.component';
import { TestimonialsComponent } from './ui/testimonials/testimonials.component';
import { NewsletterComponent } from './ui/newsletter/newsletter.component';
import { APP_TICKS, PARTNERS, TRUST, faqList, featureList } from './data/home.content';
import { sceneUri } from './data/route-art';

/** Landing page: hero with animated scene + search, trust bar, offers, popular routes, features, reviews, app promo, FAQ, newsletter. */
@Component({
  selector: 'yb-home-page',
  imports: [IconDirective, QrComponent, CountUpDirective, EmptyStateComponent, DurPipe, NprPipe, SceneFarComponent, SceneMidComponent, SceneNearComponent, SceneBusComponent,
    SearchFormComponent, TestimonialsComponent, NewsletterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './home.page.html',
})
export class HomePage {
  private metaStore = inject(MetaStore);
  private toast = inject(ToastService);
  private search = viewChild(SearchFormComponent);
  protected readonly meta = signal<Meta | null>(null);
  protected readonly error = signal('');
  protected readonly trust = TRUST;
  protected readonly ticks = APP_TICKS;
  protected readonly partners = [...PARTNERS, ...PARTNERS].map((name, i) => ({ name, initials: initials(name), dup: i >= PARTNERS.length }));
  protected features: ReturnType<typeof featureList> = [];
  protected faqs: ReturnType<typeof faqList> = [];
  protected readonly art = (i: number) => `url('${sceneUri(i)}')`;

  constructor() {
    const fx = inject(PageFxService), injector = inject(Injector);
    this.metaStore.load().then(m => {
      this.features = featureList(m.holdMinutes); this.faqs = faqList(m.holdMinutes); this.meta.set(m);
    }, e => this.error.set(e.message)).finally(() => fx.ready(injector));
  }
  protected copy(code: string) {
    navigator.clipboard?.writeText(code).catch(() => { });
    this.toast.success(`Code ${code} copied — apply it at checkout`);
  }
  protected pickRoute(r: Popular) { this.search()?.useRoute(r.from, r.to); }
}
