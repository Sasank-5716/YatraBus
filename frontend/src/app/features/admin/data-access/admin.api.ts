import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type { AdminData, AdminStats, Booking, Occupancy } from '../../../core/models/api.models';

export type Collection = 'schedules' | 'buses' | 'routes' | 'operators' | 'coupons';
export interface BookingFilter { q: string; status: string; date: string; }

/** Operator console endpoints (x-token auth added by apiInterceptor). */
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private api = inject(ApiService);
  login(password: string) { return this.api.post<{ token: string }>('/api/admin/login', { password }); }
  data() { return this.api.get<AdminData>('/api/admin/data'); }
  stats() { return this.api.get<AdminStats>('/api/admin/stats'); }
  bookings(f: BookingFilter) { return this.api.get<Booking[]>('/api/admin/bookings', { ...f }); }
  csvUrl(f: BookingFilter, token: string | null) { return '/api/admin/bookings' + this.api.qs({ ...f, format: 'csv', token }); }
  cancel(id: string) { return this.api.post(`/api/admin/bookings/${id}/cancel`); }
  occupancy(scheduleId: string, date: string) { return this.api.get<Occupancy>('/api/admin/occupancy', { scheduleId, date }); }
  reset() { return this.api.post('/api/admin/reset'); }
  save(coll: Collection, body: Record<string, unknown>, id?: number) { return id ? this.api.put(`/api/admin/${coll}/${id}`, body) : this.api.post(`/api/admin/${coll}`, body); }
  remove(coll: Collection, id: number) { return this.api.delete(`/api/admin/${coll}/${id}`); }
}
