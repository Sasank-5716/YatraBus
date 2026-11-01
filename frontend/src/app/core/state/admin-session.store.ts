import { Injectable, signal } from '@angular/core';

const KEY = 'yb_admin';
/** Operator console token (sessionStorage `yb_admin`, sent as `x-token` by apiInterceptor). */
@Injectable({ providedIn: 'root' })
export class AdminSessionStore {
  readonly token = signal<string | null>(sessionStorage.getItem(KEY));
  set(t: string) { sessionStorage.setItem(KEY, t); this.token.set(t); }
  clear() { sessionStorage.removeItem(KEY); this.token.set(null); }
}
