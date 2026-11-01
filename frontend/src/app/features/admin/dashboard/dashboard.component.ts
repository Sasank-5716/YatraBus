import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { AdminStats } from '../../../core/models/api.models';
import { fmtDate, npr } from '../../../core/utils/format';
import { CountUpDirective } from '../../../shared/directives/count-up.directive';
import { AdminApi } from '../data-access/admin.api';

const W = 700, H = 240, PL = 56, PB = 30;
const PAY_COLORS: Record<string, string> = { eSewa: '#60bb46', Khalti: '#5c2d91', Card: '#2f6fed' };
const nice = (v: number) => v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : String(v);

/** KPI cards, 14-day revenue bar chart, top routes, payment split donut and fleet badges. */
@Component({
  selector: 'yb-admin-dashboard',
  imports: [CountUpDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  protected readonly s = signal<AdminStats | null>(null);
  protected readonly W = W; protected readonly H = H;
  protected readonly error = signal('');

  constructor() { inject(AdminApi).stats().then(s => this.s.set(s), e => this.error.set(e.message)); }

  protected readonly chart = computed(() => {
    const s = this.s(); if (!s) return null;
    const maxR = Math.max(1, ...s.days.map(d => d.revenue)), bw = (W - PL - 10) / s.days.length;
    const grid = [0, .25, .5, .75, 1].map(f => { const y = H - PB - f * (H - PB - 20); return { y, label: nice(Math.round(maxR * f)) }; });
    const bars = s.days.map((d, i) => {
      const h = d.revenue / maxR * (H - PB - 20), x = PL + i * bw + bw * .18, y = H - PB - h;
      return { x, y, w: bw * .64, h: Math.max(h, d.revenue ? 2 : 0), cx: x + bw * .32, title: `${d.date}: ${npr(d.revenue)} · ${d.bookings} bookings`,
        label: i % 2 === 0 || s.days.length < 10 ? fmtDate(d.date, { day: 'numeric', month: 'short' }) : '', count: d.bookings };
    });
    return { grid, bars, pl: PL, xEnd: W - 5 };
  });
  protected readonly routes = computed(() => { const t = this.s()?.topRoutes || [], maxT = Math.max(1, ...t.map(r => r[1])); return t.map(([r, n]) => ({ r, n, pct: n / maxT * 100 })); });
  protected readonly pays = computed(() => {
    const pays = Object.entries(this.s()?.payments || {}), tot = pays.reduce((a, b) => a + b[1], 0) || 1;
    let acc = 0;
    return pays.map(([k, v]) => {
      const a0 = acc / tot * 2 * Math.PI, a1 = (acc += v) / tot * 2 * Math.PI, r = 52, c = 64, large = a1 - a0 > Math.PI ? 1 : 0, color = PAY_COLORS[k] || '#999';
      return { k, color, pct: Math.round(v / tot * 100), full: v === tot, d: `M${c + r * Math.sin(a0)} ${c - r * Math.cos(a0)} A${r} ${r} 0 ${large} 1 ${c + r * Math.sin(a1)} ${c - r * Math.cos(a1)}` };
    });
  });
}
