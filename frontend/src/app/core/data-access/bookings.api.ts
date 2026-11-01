import { Injectable, inject } from '@angular/core';
import { ApiService } from '../services/api.service';
import type { Booking } from '../models/api.models';

/** Public booking lookup + customer cancellation (ticket, manage and account pages). */
@Injectable({ providedIn: 'root' })
export class BookingsApi {
  private api = inject(ApiService);
  lookup(id: string, phone: string) { return this.api.get<Booking[]>('/api/lookup', { id, phone }); }
  cancel(id: string, phone: string) { return this.api.post<Booking>(`/api/bookings/${id}/cancel`, { phone }); }
  mine() { return this.api.get<Booking[]>('/api/account/bookings'); }
}
