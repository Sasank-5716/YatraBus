import type { Passenger } from './api.models';

/** Search form state kept between pages (sessionStorage `yb_state.search`, same shape as v5). */
export interface SearchState { from: string; to: string; date: string; round: boolean; ret: string; }
/** A held leg chosen on the seat page. */
export interface HeldLeg {
  scheduleId: number; date: string; seats: string[]; seatPrices: number[]; holdId: string; expiresAt: number; boarding: string; dropping: string;
  trip: { from: string; to: string; departure: string; arrival: string; operator: string; rating: number; busType: string; busNo: string; durationMins: number; boardingTime?: string; droppingTime?: string };
}
export interface Contact { phone: string; email: string; }
export interface BookingState { search?: SearchState; legs?: HeldLeg[]; coupon?: string; pax?: Partial<Passenger>[]; contact?: Contact; guest?: boolean; }
