import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import type { Occupancy } from '../../../core/models/api.models';
import { today } from '../../../core/utils/format';
import { SeatMapComponent } from '../../../shared/ui/seat-map/seat-map.component';
import { GenderPipe } from '../../../shared/pipes/format.pipes';
import { AdminApi } from '../data-access/admin.api';
import { AdminStore } from '../data-access/admin.store';

/** Per-trip occupancy: KPIs, read-only seat map with passenger names, and the passenger manifest. */
@Component({
  selector: 'yb-admin-occupancy',
  imports: [ReactiveFormsModule, SeatMapComponent, GenderPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './occupancy.component.html',
})
export class OccupancyComponent implements OnInit {
  readonly scheduleId = input('');
  readonly date = input('');
  private api = inject(AdminApi);
  protected store = inject(AdminStore);
  private fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({ sid: '', date: '' });
  protected readonly trip = signal<Occupancy | null>(null);
  protected readonly schedules = computed(() => {
    const st = this.store;
    return (st.data()?.schedules || []).slice().sort((a, b) => st.routeName(a.routeId).localeCompare(st.routeName(b.routeId)) || a.departure.localeCompare(b.departure))
      .map(s => ({ id: String(s.id), label: `${st.routeName(s.routeId)} · ${s.departure} · ${st.busName(s.busId)}` }));
  });
  protected readonly kpi = computed(() => { const t = this.trip(); if (!t) return null; const sold = t.booked.length; return { sold, pct: Math.round(sold / t.totalSeats * 100), manifest: Object.entries(t.seatInfo).sort() }; });

  ngOnInit() {
    const list = this.schedules();
    this.form.setValue({ sid: list.some(s => s.id == this.scheduleId()) ? this.scheduleId() : list[0]?.id ?? '', date: this.date() || today() });
    this.form.valueChanges.subscribe(() => this.load());
    this.load();
  }
  protected async load() {
    this.trip.set(null);
    const v = this.form.getRawValue();
    this.trip.set(await this.api.occupancy(v.sid, v.date));
  }
}
