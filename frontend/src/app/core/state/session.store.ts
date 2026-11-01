import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from '../services/api.service';
import type { User } from '../models/api.models';

/** Signed-in customer (cookie session `yb_sid`). */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private api = inject(ApiService);
  readonly user = signal<User | null>(null);
  readonly loggedIn = computed(() => !!this.user());
  private booted: Promise<void> | null = null;

  /** Resolves once the initial /api/auth/me check has finished. */
  ready() { return this.booted ??= this.refresh(); }
  async refresh() { try { this.user.set((await this.api.get<{ user: User | null }>('/api/auth/me')).user); } catch { this.user.set(null); } }
  set(u: User | null) { this.user.set(u); }
  async logout() { await this.api.post('/api/auth/logout').catch(() => { }); this.user.set(null); }
}
