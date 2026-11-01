import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../services/api.service';
import type { Meta } from '../models/api.models';

/** Cached /api/meta (cities, offers, popular routes, hold minutes, tax). Invalidated after admin edits. */
@Injectable({ providedIn: 'root' })
export class MetaStore {
  private api = inject(ApiService);
  private pending: Promise<Meta> | null = null;
  readonly meta = signal<Meta | null>(null);

  load(): Promise<Meta> {
    return this.pending ??= this.api.get<Meta>('/api/meta').then(m => { this.meta.set(m); return m; }, e => { this.pending = null; throw e; });
  }
  invalidate() { this.pending = null; }
}
