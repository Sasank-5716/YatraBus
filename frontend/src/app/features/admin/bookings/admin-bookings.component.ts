import { ChangeDetectionStrategy, Component, TemplateRef, computed, inject, input, signal, viewChild, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import type { Booking } from '../../../core/models/api.models';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminSessionStore } from '../../../core/state/admin-session.store';
import { IconDirective } from '../../../shared/ui/icon/icon.directive';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { TicketComponent } from '../../../shared/ui/ticket/ticket.component';
import { FareDetailsComponent } from '../../../shared/ui/fare-breakdown/fare-details.component';
import { NprPipe, StampPipe } from '../../../shared/pipes/format.pipes';
import { AdminApi, BookingFilter } from '../data-access/admin.api';

/** All bookings with search / status / travel-date filters, CSV export, view and operator cancellation (100% refund). */
@Component({
  selector: 'yb-admin-bookings',
  imports: [ReactiveFormsModule, IconDirective, EmptyStateComponent, TicketComponent, FareDetailsComponent, NprPipe, StampPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './admin-bookings.component.html',
})
export class AdminBookingsComponent implements OnInit {
  readonly query = input('');
  private api = inject(AdminApi);
  private token = inject(AdminSessionStore).token;
  private modal = inject(ModalService);
  private toast = inject(ToastService);
  private viewBody = viewChild.required<TemplateRef<unknown>>('viewBody');
  private cancelBody = viewChild.required<TemplateRef<unknown>>('cancelBody');
  private cancelFoot = viewChild.required<TemplateRef<unknown>>('cancelFoot');
  private fb = inject(NonNullableFormBuilder);
  protected readonly filter = this.fb.group({ q: '', status: '', date: '' });
  private readonly f = signal<BookingFilter>({ q: '', status: '', date: '' });
  protected readonly csv = computed(() => this.api.csvUrl(this.f(), this.token()));
  protected readonly list = signal<Booking[] | null>(null);
  protected readonly target = signal<Booking | null>(null);
  private seq = 0;

  ngOnInit() {
    this.filter.controls.q.setValue(this.query(), { emitEvent: false });
    this.filter.controls.q.valueChanges.pipe(debounceTime(250)).subscribe(() => this.load());
    this.filter.controls.status.valueChanges.subscribe(() => this.load());
    this.filter.controls.date.valueChanges.subscribe(() => this.load());
    this.load();
  }
  protected async load() {
    const v = this.filter.getRawValue(), f = { q: v.q.trim(), status: v.status, date: v.date }, my = ++this.seq;
    this.f.set(f);
    const l = await this.api.bookings(f);
    if (my === this.seq) this.list.set(l);
  }
  protected names(b: Booking) { return b.passengers.map(p => p.name).join(', '); }
  protected view(b: Booking) { this.target.set(b); this.modal.open({ title: `Booking ${b.id}`, wide: true, body: this.viewBody() }); }
  protected askCancel(b: Booking) { this.target.set(b); this.modal.open({ title: `Cancel ${b.id}?`, body: this.cancelBody(), foot: this.cancelFoot() }); }
  protected async doCancel() {
    await this.api.cancel(this.target()!.id); this.modal.close(); this.toast.success('Booking cancelled'); this.load();
  }
}
