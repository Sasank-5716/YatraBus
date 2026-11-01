import { ChangeDetectionStrategy, Component, ElementRef, TemplateRef, effect, inject } from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { ModalService } from '../../../core/services/modal.service';

/** Renders the active modal into #modal-root (markup identical to v5 modal()). */
@Component({
  selector: '[ybModalHost]',
  imports: [NgTemplateOutlet, NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'svc.close()' },
  template: `
    @if (svc.current(); as m) {
      <div class="modal-bg" data-close [class.closing]="m.closing" (click)="clicked($event)">
        <div class="modal" [class.wide]="m.cfg.wide" role="dialog" aria-modal="true" aria-labelledby="mt">
          <div class="modal-h"><h3 id="mt">{{ m.cfg.title }}</h3><button class="x" aria-label="Close" data-close>×</button></div>
          <div class="modal-b">
            @if (isTpl(m.cfg.body)) { <ng-container *ngTemplateOutlet="m.cfg.body; context: { $implicit: m.cfg.context, ref: m.ref }" /> }
            @else { <ng-container *ngComponentOutlet="m.cfg.body; inputs: inputsOf(m)" /> }
          </div>
          @if (m.cfg.foot) { <div class="modal-f"><ng-container *ngTemplateOutlet="m.cfg.foot; context: { $implicit: m.cfg.context, ref: m.ref }" /></div> }
        </div>
      </div>
    }`,
})
export class ModalHostComponent {
  protected svc = inject(ModalService);
  private host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  constructor() {
    let last: unknown = null;
    effect(() => {
      const m = this.svc.current();
      if (!m || m.closing || m.ref === last) return;
      last = m.ref;
      setTimeout(() => ((this.host.querySelector('.modal input, .modal select, .modal button:not(.x)') || this.host.querySelector('.x')) as HTMLElement | null)?.focus(), 30);
    });
  }
  protected isTpl(b: unknown): b is TemplateRef<any> { return b instanceof TemplateRef; }
  protected inputsOf(m: { cfg: { inputs?: Record<string, unknown> }; ref: unknown }) { return { ...(m.cfg.inputs || {}), modalRef: m.ref }; }
  /** v5 semantics: a click whose target itself carries [data-close] (backdrop, ×, Cancel buttons in templates) closes the modal. */
  protected clicked(e: MouseEvent) { if ((e.target as Element).hasAttribute?.('data-close')) this.svc.close(); }
}
