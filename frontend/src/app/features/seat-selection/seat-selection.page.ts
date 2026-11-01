import { ChangeDetectionStrategy, Component, Injector, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PageFxService } from '../../core/routing/page-fx.service';
import { injectQuery } from '../../core/routing/query';
import { BookingStateStore } from '../../core/state/booking-state.store';
import { MetaStore } from '../../core/state/meta.store';
import { ToastService } from '../../core/services/toast.service';
import { ApiError } from '../../core/services/api.service';
import { TripsApi } from '../../core/data-access/trips.api';
import type { Point, TripDetail } from '../../core/models/api.models';
import type { HeldLeg } from '../../core/models/booking-state.models';
import { qs } from '../../core/utils/format';
import { IconDirective } from '../../shared/ui/icon/icon.directive';
import { StepsBarComponent } from '../../shared/ui/steps/steps-bar.component';
import { SeatMapComponent, SeatToggle } from '../../shared/ui/seat-map/seat-map.component';
import { FmtDatePipe, NprPipe } from '../../shared/pipes/format.pipes';

/** #/seats?id&date&leg — seat/berth map, boarding & dropping points, and the seat hold. */
@Component({
  selector: 'yb-seat-selection-page',
  imports: [IconDirective, StepsBarComponent, SeatMapComponent, FmtDatePipe, NprPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './seat-selection.page.html',
})
export class SeatSelectionPage {
  private api = inject(TripsApi);
  private state = inject(BookingStateStore);
  private meta = inject(MetaStore);
  private toast = inject(ToastService);
  private router = inject(Router);
  private fx = inject(PageFxService);
  private injector = inject(Injector);
  protected readonly q = injectQuery();
  protected readonly leg = Number(this.q['leg'] || 0);
  private readonly st = this.state.get();
  private readonly prev: HeldLeg | undefined = (this.st.legs || [])[this.leg];
  protected readonly round = !!this.st.search?.round;
  protected readonly need = this.leg === 1 ? this.st.legs?.[0]?.seats.length ?? 0 : 0;

  protected readonly trip = signal<TripDetail | null>(null);
  protected readonly error = signal('');
  protected readonly sel = signal<string[]>([]);
  protected readonly bp = signal('');
  protected readonly dp = signal('');
  protected readonly tab = signal<'b' | 'd'>('b');
  protected readonly busy = signal(false);

  private readonly prices = computed(() => { const m = new Map<string, number>(); this.trip()?.layout.forEach(d => d.rows.flat().forEach(s => s && m.set(s.id, s.price))); return m; });
  protected readonly points = computed<Point[]>(() => { const t = this.trip(); return t ? (this.tab() === 'b' ? t.boarding : t.dropping) : []; });
  protected readonly total = computed(() => this.sel().reduce((a, s) => a + this.priceOf(s), 0));
  protected readonly canContinue = computed(() => !!this.sel().length && !(this.need && this.sel().length !== this.need));
  protected readonly contLabel = computed(() => {
    const n = this.sel().length, need = this.need;
    return need && n !== need ? `Select ${need - n > 0 ? need - n + ' more' : 'only ' + need}` : this.leg === 0 && this.st.search?.round ? 'Continue to return trip' : 'Continue to checkout';
  });

  constructor() {
    this.api.trip(this.q['id'], this.q['date'], this.prev?.holdId || '').then(t => {
      const p = this.prev;
      this.sel.set(p && p.scheduleId == t.id && p.date === this.q['date'] ? p.seats.filter(x => !t.booked.includes(x)) : []);
      this.bp.set(p?.boarding || t.boarding[0].name); this.dp.set(p?.dropping || t.dropping[t.dropping.length - 1].name);
      this.trip.set(t);
    }, e => this.error.set(e.message)).finally(() => this.fx.ready(this.injector));
  }

  protected priceOf(id: string) { return this.prices().get(id) || 0; }
  protected backLink(t: TripDetail) { return '#/search?' + qs({ from: t.from, to: t.to, date: this.q['date'], leg: this.leg }); }
  protected pickPoint(name: string) { if (this.tab() === 'b') { this.bp.set(name); this.tab.set('d'); } else this.dp.set(name); }

  protected toggleSeat({ seat, el }: SeatToggle) {
    const id = seat.id, cur = this.sel();
    if (cur.includes(id)) this.sel.set(cur.filter(x => x !== id));
    else {
      const max = this.need || 6;
      if (cur.length >= max) { this.toast.error(this.need ? `You need exactly ${this.need} seat(s) on the return trip` : 'You can book up to 6 seats at a time'); return; }
      this.sel.set([...cur, id]);
      if (seat.ladies) this.toast.show(`${id} is a ladies seat — please assign it to a female passenger`);
    }
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }

  protected async continue() {
    const t = this.trip()!, sel = this.sel(), date = this.q['date'];
    this.busy.set(true);
    try {
      const h = await this.api.hold({ scheduleId: t.id, date, seats: sel, previous: this.prev?.holdId });
      const legs = (this.state.get().legs || []).slice(0, this.leg), bp = this.bp(), dp = this.dp();
      legs[this.leg] = {
        scheduleId: t.id, date, seats: [...sel], seatPrices: sel.map(s => this.priceOf(s)), holdId: h.holdId, expiresAt: h.expiresAt, boarding: bp, dropping: dp,
        trip: { from: t.from, to: t.to, departure: t.departure, arrival: t.arrival, operator: t.operator.name, rating: t.operator.rating, busType: t.bus.type, busNo: t.bus.number, durationMins: t.durationMins,
          boardingTime: t.boarding.find(x => x.name === bp)?.time, droppingTime: t.dropping.find(x => x.name === dp)?.time },
      };
      const s = this.state.set({ legs });
      this.toast.success(`Seats ${sel.join(', ')} held for ${this.meta.meta()?.holdMinutes || 10} minutes`);
      if (this.leg === 0 && s.search?.round) this.router.navigate(['/search'], { queryParams: { from: t.to, to: t.from, date: s.search.ret, leg: 1 } });
      else this.router.navigateByUrl('/checkout');
    } catch (err) {
      this.busy.set(false); this.toast.error((err as Error).message);
      if (err instanceof ApiError && err.status === 409) {
        const fresh = await this.api.trip(this.q['id'], date);
        const clash: string[] = err.data?.clash || [];
        this.trip.set(fresh); this.sel.update(l => l.filter(x => !clash.includes(x)));
      }
    }
  }
}
