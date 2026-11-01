import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { TripSummary } from '../../../core/models/api.models';
import { ratingCls } from '../../../core/utils/format';
import { AMEN, hasIcon } from '../icon/icons';
import { IconDirective } from '../icon/icon.directive';
import { DurPipe, NprPipe } from '../../pipes/format.pipes';

/** Search result card: `<article class="card bus-card" ybBusCard [trip]="t" (viewSeats)="…">` (expands on hover/focus via CSS). */
@Component({
  selector: 'article[ybBusCard]',
  imports: [IconDirective, NprPipe, DurPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.aria-label]': 'trip().operator.name + " " + trip().departure' },
  templateUrl: './bus-card.component.html',
})
export class BusCardComponent {
  readonly trip = input.required<TripSummary>();
  readonly viewSeats = output<TripSummary>();
  protected readonly AMEN = AMEN;
  protected readonly hasIcon = hasIcon;
  protected readonly ratingCls = ratingCls;
}
