import { Injectable, inject, signal } from '@angular/core';
import type { AdminData } from '../../../core/models/api.models';
import { AdminApi } from './admin.api';

/** Catalogue snapshot (routes, buses, operators, schedules, coupons) shared by the console tabs. */
@Injectable({ providedIn: 'root' })
export class AdminStore {
  private api = inject(AdminApi);
  readonly data = signal<AdminData | null>(null);
  async load() { const d = await this.api.data(); this.data.set(d); return d; }

  routeName(id: number | string) { const r = this.data()?.routes.find(x => x.id == id); return r ? `${r.from} → ${r.to}` : '—'; }
  opName(id: number | string) { return this.data()?.operators.find(x => x.id == id)?.name || '—'; }
  busName(id: number | string) { const b = this.data()?.buses.find(x => x.id == id); return b ? `${this.opName(b.operatorId)} · ${b.type}` : '—'; }
}
