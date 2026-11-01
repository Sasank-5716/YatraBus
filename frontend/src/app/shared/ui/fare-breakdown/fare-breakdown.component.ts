import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NprPipe } from '../../pipes/format.pipes';

export interface FareLine { label: string; amount: number; }

/** Key/value fare rows (base lines, discount, VAT, service, total) used by checkout and the ticket fare card. */
@Component({
  selector: 'yb-fare-breakdown',
  imports: [NprPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  template: `@for (l of lines(); track $index) {<div class="kv"><span>{{ l.label }}</span><span>{{ l.amount | npr }}</span></div>}@if (discount()) {<div class="kv"><span>Discount ({{ coupon() }})</span><span class="neg">− {{ discount() | npr }}</span></div>}<div class="kv"><span>{{ taxLabel() }}</span><span>{{ tax() | npr }}</span></div><div class="kv"><span>Service charge</span><span>{{ service() | npr }}</span></div><div class="kv total"><span>{{ totalLabel() }}</span><span>{{ total() | npr }}</span></div>`,
})
export class FareBreakdownComponent {
  readonly lines = input.required<FareLine[]>();
  readonly discount = input(0);
  readonly coupon = input<string | null | undefined>('');
  readonly tax = input.required<number>();
  readonly taxLabel = input('VAT');
  readonly service = input.required<number>();
  readonly total = input.required<number>();
  readonly totalLabel = input('Total paid');
}
