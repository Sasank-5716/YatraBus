/* API contracts shared with the .NET backend (camelCase JSON). */
export type Gender = 'M' | 'F' | 'O';
export interface User { id: string; name: string; email: string; phone: string; createdAt: string; }
export interface Operator { id: number; name: string; rating: number; reviews: number; }
export interface Bus { id: number; operatorId: number; number: string; type: string; layout: 'seater' | 'sofa' | 'sleeper' | 'micro'; ac: boolean; amenities: string[]; }
export interface BusRoute { id: number; from: string; to: string; km: number; baseFare: number; durationMins?: number; }
export interface Schedule { id: number; routeId: number; busId: number; departure: string; durationMins: number; fare: number; active?: boolean; }
export interface Coupon { code: string; description: string; type: 'percent' | 'flat'; value: number; maxDiscount: number; minAmount: number; roundTripOnly?: boolean; active?: boolean; }
export interface Point { name: string; time: string; }
export interface Popular { from: string; to: string; km: number; durationMins: number; trips: number; minFare: number; }
export interface Meta { cities: string[]; operators: number; popular: Popular[]; offers: Coupon[]; holdMinutes: number; tax: number; }

export interface TripSummary {
  id: number; departure: string; arrival: string; nextDay?: boolean; durationMins: number; minFare: number; seatsLeft: number; totalSeats: number; departed?: boolean;
  operator: Operator; bus: Bus; boarding: Point[]; dropping: Point[];
}
export interface Seat { id: string; kind: 'seat' | 'berth'; ladies?: boolean; price: number; }
export interface Deck { name: string; rows: (Seat | null)[][]; }
export interface SeatInfo { name: string; age: number; gender: Gender; phone: string; boarding: string; id: string; }
export interface TripDetail extends TripSummary { from: string; to: string; layout: Deck[]; booked: string[]; held: string[]; }
export interface Occupancy extends TripDetail { seatInfo: Record<string, SeatInfo>; }
export interface Hold { holdId: string; expiresAt: number; }

export interface Passenger { name: string; age: number; gender: Gender; }
export interface Fare { base: number; discount: number; coupon?: string | null; tax: number; service: number; total: number; }
export interface Quote extends Fare { couponError?: string | null; }
export interface LegSnapshot { from: string; to: string; departure: string; arrival: string; operator: string; busType: string; busNo: string; durationMins: number; }
export interface BookingLeg { scheduleId: number; date: string; seats: string[]; snapshot: LegSnapshot; boarding: Point; dropping: Point; }
export interface Booking {
  id: string; userId?: string | null; status: 'confirmed' | 'cancelled'; phone: string; email?: string; passengers: Passenger[]; legs: BookingLeg[];
  fare: Fare; payment: { method: string; ref: string }; createdAt: string; cancelledAt?: string; refund?: { amount: number; percent: number; by?: string; allowed?: boolean; hoursLeft?: number };
}
export interface AdminStats {
  bookings: number; confirmed: number; revenue: number; seats: number; refunds: number; cancelled: number;
  days: { date: string; revenue: number; bookings: number }[]; topRoutes: [string, number][]; payments: Record<string, number>;
  fleet: { operators: number; buses: number; routes: number; schedules: number };
}
export interface AdminData { routes: BusRoute[]; buses: Bus[]; operators: Operator[]; schedules: Schedule[]; coupons: Coupon[]; }
