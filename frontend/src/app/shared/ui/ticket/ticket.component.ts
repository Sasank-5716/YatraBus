import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Booking } from '../../../core/models/api.models';
import { IconDirective } from '../icon/icon.directive';
import { QrComponent } from '../qr/qr.component';
import { DurPipe, FmtDatePipe, GenderPipe, NprPipe, StampPipe, T12Pipe } from '../../pipes/format.pipes';

/** E-ticket: one `<article class="ticket">` per journey leg, with passengers and a boarding QR code. */
@Component({
  selector: 'yb-ticket',
  imports: [IconDirective, QrComponent, NprPipe, DurPipe, T12Pipe, FmtDatePipe, StampPipe, GenderPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './ticket.component.html',
})
export class TicketComponent {
  readonly booking = input.required<Booking>();
  protected readonly qrText = computed(() => {
    const b = this.booking();
    return `YATRABUS|${b.id}|${b.phone}|${b.legs.map(l => l.date + ' ' + l.snapshot.departure + ' ' + l.seats.join('+')).join('|')}`;
  });
}
