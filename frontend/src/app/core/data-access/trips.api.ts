import { Injectable, inject } from '@angular/core';
import { ApiService } from '../services/api.service';
import type { Hold, TripDetail } from '../models/api.models';

/** Trip detail (seat layout + live availability) and seat holds — shared by seat selection and checkout. */
@Injectable({ providedIn: 'root' })
export class TripsApi {
  private api = inject(ApiService);
  trip(id: number | string, date: string, hold = '') { return this.api.get<TripDetail>(`/api/trip/${id}`, { date, hold }); }
  hold(body: { scheduleId: number; date: string; seats: string[]; previous?: string }) { return this.api.post<Hold>('/api/hold', body); }
}
