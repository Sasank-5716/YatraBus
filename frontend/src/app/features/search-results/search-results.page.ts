import { ChangeDetectionStrategy, Component, Injector, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PageFxService } from '../../core/routing/page-fx.service';
import { injectQuery } from '../../core/routing/query';
import { BookingStateStore } from '../../core/state/booking-state.store';
import type { TripSummary } from '../../core/models/api.models';
import { addDays, fmtDate, today } from '../../core/utils/format';
import { IconDirective } from '../../shared/ui/icon/icon.directive';
import { StepsBarComponent } from '../../shared/ui/steps/steps-bar.component';
import { BusCardComponent } from '../../shared/ui/bus-card/bus-card.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FmtDatePipe } from '../../shared/pipes/format.pipes';
import { SearchApi } from './data-access/search.api';
import { ResultsStore, SORTS } from './data-access/results.store';
import { FiltersPanelComponent } from './ui/filters-panel.component';

/** #/search?from&to&date&leg — date strip, filters, sort chips and bus cards for one journey leg. */
@Component({
  selector: 'yb-search-results-page',
  imports: [IconDirective, StepsBarComponent, BusCardComponent, EmptyStateComponent, FiltersPanelComponent, FmtDatePipe],
  providers: [ResultsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './search-results.page.html',
})
export class SearchResultsPage {
  protected s = inject(ResultsStore);
  private api = inject(SearchApi);
  private state = inject(BookingStateStore);
  private router = inject(Router);
  private fx = inject(PageFxService);
  private injector = inject(Injector);
  protected readonly q = injectQuery();
  protected readonly leg = Number(this.q['leg'] || 0);
  protected readonly round = !!this.state.get().search?.round;
  protected readonly sorts = SORTS;
  protected readonly error = signal('');
  protected readonly filtersOpen = signal(false);
  protected readonly skeletons = [0, 1, 2, 3];
  protected readonly longDate = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } as const;
  protected readonly dates: string[];
  protected readonly countText = computed(() => { const l = this.s.list(); return l ? `${this.s.visible().length} of ${l.length} buses` : ''; });

  constructor() {
    const { from, to, date } = this.q, st = this.state.get();
    this.dates = date ? [-2, -1, 0, 1, 2, 3, 4].map(n => addDays(date, n)).filter(d => d >= today() && (this.leg === 0 || d >= (st.search?.date ?? ''))) : [];
    if (!from || !to || !date) { this.router.navigateByUrl('/'); return; }
    this.api.search(from, to, date).then(l => this.s.setList(l), e => this.error.set(e.message)).finally(() => this.fx.ready(this.injector));
  }
  protected weekday(d: string) { return fmtDate(d, { weekday: 'short' }); }
  protected dayMonth(d: string) { return fmtDate(d, { day: 'numeric', month: 'short' }); }
  protected pickDate(d: string) {
    const st = this.state.get(), s = st.search!;
    if (this.leg === 0) this.state.set({ search: { ...s, date: d, ret: s?.ret < d ? d : s?.ret } }); else this.state.set({ search: { ...s, ret: d } });
    this.router.navigate(['/search'], { queryParams: { ...this.q, date: d } });
  }
  protected seats(t: TripSummary) { this.router.navigate(['/seats'], { queryParams: { id: t.id, date: this.q['date'], leg: this.leg } }); }
  protected retry() { this.fx.reload(); }
}
