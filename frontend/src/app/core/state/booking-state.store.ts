import { Injectable, signal } from '@angular/core';
import type { BookingState } from '../models/booking-state.models';

const KEY = 'yb_state';

/** Booking-flow store: a signal mirrored to sessionStorage (`yb_state`, identical to v5 so reloads/tests keep working). */
@Injectable({ providedIn: 'root' })
export class BookingStateStore {
  private readonly state = signal<BookingState>(this.read());
  readonly value = this.state.asReadonly();

  /** Latest state (re-read from storage so external edits are seen, like v5's S.get()). */
  get(): BookingState { const s = this.read(); this.state.set(s); return s; }
  set(patch: Partial<BookingState>): BookingState { const s = { ...this.read(), ...patch }; this.write(s); return s; }
  replace(s: BookingState) { this.write(s); }
  /** Drop guest/contact/passenger details (on logout). */
  forgetPerson() { const s = this.read(); delete s.pax; delete s.contact; delete s.guest; this.write(s); }

  private read(): BookingState { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null') || {}; } catch { return {}; } }
  private write(s: BookingState) { sessionStorage.setItem(KEY, JSON.stringify(s)); this.state.set(s); }
}
