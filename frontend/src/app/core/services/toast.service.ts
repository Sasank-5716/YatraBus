import { Injectable, signal } from '@angular/core';

export type ToastType = 'info' | 'success' | 'error';
export interface Toast { id: number; msg: string; type: ToastType; out: boolean; }

/** Toast queue rendered by ToastHostComponent (max 3 visible, slide out after `ms`). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);
  show(msg: string, type: ToastType = 'info', ms = 3500) {
    const t: Toast = { id: ++this.seq, msg, type, out: false };
    this.toasts.update(l => [...l.slice(Math.max(0, l.length - 2)), t]);
    setTimeout(() => {
      this.toasts.update(l => l.map(x => x.id === t.id ? { ...x, out: true } : x));
      setTimeout(() => this.toasts.update(l => l.filter(x => x.id !== t.id)), 260);
    }, ms);
  }
  success(msg: string, ms?: number) { this.show(msg, 'success', ms); }
  error(msg: string, ms?: number) { this.show(msg, 'error', ms); }
}
