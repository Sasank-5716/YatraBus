import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MetaStore } from '../state/meta.store';
import type { Popular } from '../models/api.models';
import { qs, today } from '../utils/format';

/** Site footer (static links + top routes from /api/meta). */
@Component({
  selector: 'footer[ybSiteFooter]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-footer.component.html',
})
export class SiteFooterComponent {
  private meta = inject(MetaStore);
  protected readonly routes = computed(() => this.meta.meta()?.popular.slice(0, 5) ?? []);
  constructor() { this.meta.load().catch(() => { }); }
  protected link(r: Popular) { return '#/search?' + qs({ from: r.from, to: r.to, date: today(), leg: 0 }); }
}
