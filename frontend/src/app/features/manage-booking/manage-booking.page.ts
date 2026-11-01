import { ChangeDetectionStrategy, Component, Injector, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PageFxService } from '../../core/routing/page-fx.service';
import { injectQuery } from '../../core/routing/query';
import { BookingStateStore } from '../../core/state/booking-state.store';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { BookingsApi } from '../../core/data-access/bookings.api';
import type { Booking } from '../../core/models/api.models';
import { npr, qs } from '../../core/utils/format';
import { TicketComponent } from '../../shared/ui/ticket/ticket.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { NprPipe } from '../../shared/pipes/format.pipes';

/** #/manage[?id&phone] — find bookings by ticket ID and/or phone, view tickets, cancel with refund preview. */
@Component({
  selector: 'yb-manage-booking-page',
  imports: [ReactiveFormsModule, TicketComponent, EmptyStateComponent, NprPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './manage-booking.page.html',
})
export class ManageBookingPage {
  private api = inject(BookingsApi);
  private modal = inject(ModalService);
  private toast = inject(ToastService);
  private cancelBody = viewChild.required<TemplateRef<unknown>>('cancelBody');
  private cancelFoot = viewChild.required<TemplateRef<unknown>>('cancelFoot');
  protected readonly q = injectQuery();
  private fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({ id: this.q['id'] || '', phone: this.q['phone'] || inject(BookingStateStore).get().contact?.phone || '' });
  protected readonly confirmPhone = this.fb.control('');
  protected readonly formError = signal('');
  protected readonly status = signal<'idle' | 'loading' | 'done' | 'error'>('idle');
  protected readonly results = signal<Booking[]>([]);
  protected readonly error = signal('');
  protected readonly cancelling = signal<Booking | null>(null);
  protected readonly cancelError = signal('');
  protected readonly busy = signal(false);
  protected readonly policy = [['More than 48 hours', '90%'], ['24 – 48 hours', '75%'], ['6 – 24 hours', '50%']];
  private phone = '';

  constructor() {
    const fx = inject(PageFxService), injector = inject(Injector);
    if (this.q['id'] || this.q['phone']) this.run().finally(() => fx.ready(injector)); else fx.ready(injector);
  }
  protected submit(e: Event) { e.preventDefault(); this.run(); }
  protected async run() {
    const id = this.form.value.id!.trim(), phone = this.form.value.phone!.trim();
    if (!id && !phone) { this.formError.set('Enter a ticket ID or mobile number'); return; }
    this.formError.set(''); this.status.set('loading'); this.phone = phone;
    try { this.results.set(await this.api.lookup(id, phone)); this.status.set('done'); }
    catch (e) { this.error.set((e as Error).message); this.status.set('error'); }
  }
  protected ticketLink(b: Booking) { return '#/ticket?' + qs({ id: b.id, phone: b.phone }); }
  protected routes(b: Booking) { return b.legs.map(l => l.snapshot.from + ' → ' + l.snapshot.to).join(', '); }
  protected askCancel(b: Booking) {
    this.cancelling.set(b); this.cancelError.set(''); this.busy.set(false); this.confirmPhone.setValue(this.phone);
    this.modal.open({ title: 'Cancel booking?', body: this.cancelBody(), foot: this.cancelFoot() });
  }
  protected async doCancel() {
    const b = this.cancelling()!; this.busy.set(true);
    try {
      await this.api.cancel(b.id, this.confirmPhone.value.trim());
      this.modal.close(); this.toast.success(`Booking cancelled. ${npr(b.refund?.amount)} will be refunded (simulated).`, 5000); this.run();
    } catch (err) { this.busy.set(false); this.cancelError.set((err as Error).message); }
  }
}
