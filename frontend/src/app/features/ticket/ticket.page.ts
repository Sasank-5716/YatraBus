import { ChangeDetectionStrategy, Component, ElementRef, Injector, inject, signal } from '@angular/core';
import { PageFxService } from '../../core/routing/page-fx.service';
import { injectQuery } from '../../core/routing/query';
import { SessionStore } from '../../core/state/session.store';
import { ToastService } from '../../core/services/toast.service';
import { BookingsApi } from '../../core/data-access/bookings.api';
import type { Booking } from '../../core/models/api.models';
import { firstName, qs } from '../../core/utils/format';
import { IconDirective } from '../../shared/ui/icon/icon.directive';
import { TicketComponent } from '../../shared/ui/ticket/ticket.component';
import { FareDetailsComponent } from '../../shared/ui/fare-breakdown/fare-details.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FmtDatePipe, NprPipe } from '../../shared/pipes/format.pipes';
import { downloadTicket } from './ticket-download';

/** #/ticket?id&phone[&new=1] — confirmation hero with SMS/e-mail previews, print/download, the e-ticket and fare card. */
@Component({
  selector: 'yb-ticket-page',
  imports: [IconDirective, TicketComponent, FareDetailsComponent, EmptyStateComponent, FmtDatePipe, NprPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './ticket.page.html',
})
export class TicketPage {
  private api = inject(BookingsApi);
  private toast = inject(ToastService);
  protected session = inject(SessionStore);
  private host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  protected readonly q = injectQuery();
  protected readonly booking = signal<Booking | null | undefined>(undefined);
  protected readonly error = signal('');
  protected readonly firstName = firstName;
  protected readonly smsDate = { day: 'numeric', month: 'short' } as const;

  constructor() {
    const fx = inject(PageFxService), injector = inject(Injector);
    this.api.lookup(this.q['id'], this.q['phone'] || '').then(([b]) => this.booking.set(b ?? null), e => this.error.set(e.message)).finally(() => fx.ready(injector));
  }
  protected manageLink(b: Booking) { return '#/manage?' + qs({ id: b.id, phone: b.phone }); }
  protected print() { window.print(); }
  protected download(b: Booking) { downloadTicket(b, this.host.parentElement!); this.toast.success('Ticket downloaded'); }
}
