import { Injectable, computed, signal } from '@angular/core';
import type { TripSummary } from '../../../core/models/api.models';

export type SortKey = 'departure' | 'price' | 'duration' | 'rating' | 'seats';
export const SORTS: [SortKey, string][] = [['departure', 'Departure'], ['price', 'Price'], ['duration', 'Duration'], ['rating', 'Rating'], ['seats', 'Seats left']];
export const SLOTS: [string, string, number, number][] = [['early', 'Before 6 AM', 0, 360], ['morning', '6 AM – 12 PM', 360, 720], ['afternoon', '12 PM – 6 PM', 720, 1080], ['night', 'After 6 PM', 1080, 1440]];
export const BUS_TYPES = ['AC', 'Non-AC', 'Sleeper', 'Seater', 'Micro'];
export const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const typeTags = (b: TripSummary['bus']) => [b.ac ? 'AC' : 'Non-AC', b.layout === 'sleeper' ? 'Sleeper' : b.layout === 'micro' ? 'Micro' : 'Seater'];
const inSlot = (t: TripSummary, [, , a, b]: (typeof SLOTS)[number]) => toMin(t.departure) >= a && toMin(t.departure) < b;

const SORTERS: Record<SortKey, (a: TripSummary, b: TripSummary) => number> = {
  departure: (a, b) => a.departure.localeCompare(b.departure), price: (a, b) => a.minFare - b.minFare, duration: (a, b) => a.durationMins - b.durationMins,
  rating: (a, b) => b.operator.rating - a.operator.rating, seats: (a, b) => b.seatsLeft - a.seatsLeft,
};

/** Search results state: the trip list plus filter/sort signals and the derived visible list. Provided per page. */
@Injectable()
export class ResultsStore {
  readonly list = signal<TripSummary[] | null>(null);
  readonly types = signal(new Set<string>());
  readonly slots = signal(new Set<string>());
  readonly ops = signal(new Set<string>());
  readonly amen = signal(new Set<string>());
  readonly max = signal(500);
  readonly sort = signal<SortKey>('departure');

  readonly operators = computed(() => [...new Set((this.list() || []).map(x => x.operator.name))].sort());
  readonly maxPrice = computed(() => Math.max(500, ...(this.list() || []).map(x => x.minFare)));
  readonly minPrice = computed(() => Math.min(...(this.list() || []).map(x => x.minFare), this.maxPrice()));
  readonly visible = computed(() => {
    const T = this.types(), S = this.slots(), O = this.ops(), A = this.amen(), max = this.max();
    return (this.list() || []).filter(x => (!T.size || [...T].every(t => typeTags(x.bus).includes(t)))
      && (!S.size || SLOTS.some(s => S.has(s[0]) && inSlot(x, s)))
      && (!O.size || O.has(x.operator.name)) && [...A].every(a => x.bus.amenities.includes(a)) && x.minFare <= max)
      .sort(SORTERS[this.sort()]);
  });

  setList(l: TripSummary[]) { this.list.set(l); this.max.set(this.maxPrice()); }
  count(f: (t: TripSummary) => boolean) { return (this.list() || []).filter(f).length; }
  typeCount(t: string) { return this.count(x => typeTags(x.bus).includes(t)); }
  slotCount(s: (typeof SLOTS)[number]) { const n = this.count(x => inSlot(x, s)); return n + (n === 1 ? ' bus' : ' buses'); }
  opCount(o: string) { return this.count(x => x.operator.name === o); }
  toggle(key: 'types' | 'slots' | 'ops' | 'amen', v: string, on: boolean) {
    this[key].update(s => { const n = new Set(s); if (on) n.add(v); else n.delete(v); return n; });
  }
  clear() { this.types.set(new Set()); this.slots.set(new Set()); this.ops.set(new Set()); this.amen.set(new Set()); this.max.set(this.maxPrice()); }
}
