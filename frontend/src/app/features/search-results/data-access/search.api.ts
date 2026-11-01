import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type { TripSummary } from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class SearchApi {
  private api = inject(ApiService);
  search(from: string, to: string, date: string) { return this.api.get<TripSummary[]>('/api/search', { from, to, date }); }
}
