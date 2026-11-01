import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

/** Toast stack rendered into #toasts (same markup and animation classes as v5 toast()). */
@Component({
  selector: '[ybToastHost]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (t of svc.toasts(); track t.id) {<div class="toast {{ t.type }}" [class.out]="t.out" [attr.role]="t.type === 'error' ? 'alert' : 'status'"><span aria-hidden="true">{{ t.type === 'success' ? '✓' : t.type === 'error' ? '!' : 'ℹ' }}</span><span>{{ t.msg }}</span></div>}`,
})
export class ToastHostComponent { protected svc = inject(ToastService); }
