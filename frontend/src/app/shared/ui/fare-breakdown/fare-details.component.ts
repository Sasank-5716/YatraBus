import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Booking } from '../../../core/models/api.models';
import { FareBreakdownComponent } from './fare-breakdown.component';

/** Paid-booking fare card: `<div class="card" style="margin-bottom:20px" ybFareDetails [booking]="b">` */
@Component({
  selector: '[ybFareDetails]',
  imports: [FareBreakdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@let f = booking().fare;<h3>Fare details</h3><yb-fare-breakdown [lines]="base()" [discount]="f.discount" [coupon]="f.coupon" [tax]="f.tax" [service]="f.service" [total]="f.total" /><p class="tiny muted">Ref {{ booking().payment.ref }} · {{ booking().payment.method }}</p>`,
})
export class FareDetailsComponent {
  readonly booking = input.required<Booking>();
  protected readonly base = computed(() => [{ label: 'Base fare', amount: this.booking().fare.base }]);
}
