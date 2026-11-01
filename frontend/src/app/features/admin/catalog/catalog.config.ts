import type { Collection } from '../data-access/admin.api';

export type FieldType = 'route' | 'bus' | 'operator' | 'layout' | 'ctype' | 'bool' | 'amen' | 'text' | 'number' | 'time';
export interface FieldDef { key: string; label: string; type: FieldType; }
export interface CollectionDef { title: string; head: string[]; fields: FieldDef[]; }

const f = (key: string, label: string, type: FieldType): FieldDef => ({ key, label, type });

/** Editable catalogue collections: table columns and editor fields (same as v5 CRUD config). */
export const CATALOG: Record<Collection, CollectionDef> = {
  schedules: { title: 'Schedules', head: ['Route', 'Departs', 'Duration', 'Bus', 'Fare', 'Status'],
    fields: [f('routeId', 'Route', 'route'), f('busId', 'Bus', 'bus'), f('departure', 'Departure time', 'time'), f('durationMins', 'Duration (mins)', 'number'), f('fare', 'Base fare (Rs.)', 'number'), f('active', 'Active (bookable)', 'bool')] },
  buses: { title: 'Buses', head: ['Reg. no.', 'Operator', 'Type', 'Layout', 'AC', 'Amenities'],
    fields: [f('operatorId', 'Operator', 'operator'), f('number', 'Registration no.', 'text'), f('type', 'Display type', 'text'), f('layout', 'Seat layout', 'layout'), f('ac', 'Air conditioned', 'bool'), f('amenities', 'Amenities', 'amen')] },
  routes: { title: 'Routes', head: ['From', 'To', 'Distance', 'Ref. fare', 'Duration'],
    fields: [f('from', 'From city', 'text'), f('to', 'To city', 'text'), f('km', 'Distance (km)', 'number'), f('baseFare', 'Reference fare (Rs.)', 'number'), f('durationMins', 'Typical duration (mins)', 'number')] },
  operators: { title: 'Operators', head: ['Name', 'Rating', 'Reviews'],
    fields: [f('name', 'Name', 'text'), f('rating', 'Rating (0–5)', 'number'), f('reviews', 'Review count', 'number')] },
  coupons: { title: 'Coupons', head: ['Code', 'Description', 'Value', 'Max', 'Min. booking', 'Status'],
    fields: [f('code', 'Code', 'text'), f('description', 'Description', 'text'), f('type', 'Type', 'ctype'), f('value', 'Value (% or Rs.)', 'number'), f('maxDiscount', 'Max discount (Rs.)', 'number'), f('minAmount', 'Min. booking (Rs.)', 'number'), f('roundTripOnly', 'Round trips only', 'bool'), f('active', 'Active', 'bool')] },
};
export const LAYOUTS: [string, string][] = [['seater', 'Seater 2+2 (41)'], ['sofa', 'Sofa 2+1 (28)'], ['sleeper', 'Sleeper, 2 decks (36)'], ['micro', 'Micro 15+1 (16)']];
export const COUPON_TYPES: [string, string][] = [['percent', 'Percentage'], ['flat', 'Flat amount']];
