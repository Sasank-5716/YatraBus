import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type { Booking, Passenger, Quote } from '../../../core/models/api.models';

export interface LegRequest { scheduleId: number; date: string; seats: string[]; holdId: string; boarding: string; dropping: string; }
export interface QuoteResponse extends Quote { legs: { seats: string[]; subtotal: number }[]; }
export interface BookingRequest { legs: LegRequest[]; coupon: string; passengers: Passenger[]; phone: string; email: string; payment: string; }

@Injectable({ providedIn: 'root' })
export class CheckoutApi {
  private api = inject(ApiService);
  quote(legs: LegRequest[], coupon: string) { return this.api.post<QuoteResponse>('/api/quote', { legs, coupon }); }
  book(req: BookingRequest) { return this.api.post<Booking>('/api/bookings', req); }
}
