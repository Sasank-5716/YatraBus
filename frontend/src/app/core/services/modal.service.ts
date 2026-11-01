import { Injectable, TemplateRef, Type, signal } from '@angular/core';
import { REDUCED_MOTION } from '../utils/format';

export interface ModalConfig {
  title: string;
  wide?: boolean;
  /** Body content: a template (rendered with `context`) or a standalone component (rendered with `inputs`). */
  body: TemplateRef<any> | Type<any>;
  foot?: TemplateRef<any>;
  context?: any;
  inputs?: Record<string, unknown>;
  onClose?: () => void;
}
export interface OpenModal { cfg: ModalConfig; ref: ModalRef; closing: boolean; }

export class ModalRef {
  constructor(private svc: ModalService) { }
  close() { this.svc.close(this); }
}

/** Single-slot modal dialog (same behaviour as v5 modal(): Esc/backdrop close, focus first field, restore focus). */
@Injectable({ providedIn: 'root' })
export class ModalService {
  readonly current = signal<OpenModal | null>(null);
  private lastFocus: HTMLElement | null = null;

  open(cfg: ModalConfig): ModalRef {
    this.lastFocus = document.activeElement as HTMLElement;
    const ref = new ModalRef(this);
    this.current.set({ cfg, ref, closing: false });
    return ref;
  }
  close(ref?: ModalRef) {
    const cur = this.current(); if (!cur || cur.closing || (ref && cur.ref !== ref)) return;
    this.current.set({ ...cur, closing: true });
    setTimeout(() => { if (this.current()?.ref === cur.ref) this.current.set(null); }, REDUCED_MOTION ? 0 : 180);
    cur.cfg.onClose?.();
    this.lastFocus?.focus?.();
  }
  /** Remove immediately without the close animation or callbacks. */
  dismiss() { this.current.set(null); }
}
