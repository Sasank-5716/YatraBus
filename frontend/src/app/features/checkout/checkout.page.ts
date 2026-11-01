import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injector, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, merge } from 'rxjs';
import { PageFxService } from '../../core/routing/page-fx.service';
import { BookingStateStore } from '../../core/state/booking-state.store';
import { SessionStore } from '../../core/state/session.store';
import { MetaStore } from '../../core/state/meta.store';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiError } from '../../core/services/api.service';
import { TripsApi } from '../../core/data-access/trips.api';
import type { Gender, Meta } from '../../core/models/api.models';
import type { HeldLeg } from '../../core/models/booking-state.models';
import { npr, pad, qs, wait } from '../../core/utils/format';
import { AuthDialogService } from '../auth/data-access/auth-dialog.service';
import { IconDirective } from '../../shared/ui/icon/icon.directive';
import { StepsBarComponent } from '../../shared/ui/steps/steps-bar.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FareBreakdownComponent, FareLine } from '../../shared/ui/fare-breakdown/fare-breakdown.component';
import { FmtDatePipe, InitialsPipe, NprPipe } from '../../shared/pipes/format.pipes';
import { CheckoutApi, LegRequest, QuoteResponse } from './data-access/checkout.api';

type PaxGroup = FormGroup<{ name: FormControl<string>; age: FormControl<number | null>; gender: FormControl<Gender | ''> }>;
/** Per-passenger note under the fields: ladies-seat hint, missing gender, or ladies-seat conflict. */
type PaxNote = '' | 'ladies-required' | 'ladies' | 'gender' | 'lady-bad';

const PHONE = /^9[678]\d{8}$/, EMAIL = /^\S+@\S+\.\S+$/;
export const GENDERS: [Gender, string][] = [['M', 'Male'], ['F', 'Female'], ['O', 'Other']];
const GATEWAY_BG: Record<string, string> = { eSewa: 'var(--esewa)', Khalti: 'var(--khalti)', Card: 'linear-gradient(135deg,#13305a,#2f6fed)' };

/** #/checkout — passengers, contact, coupon, live fare quote, hold countdown and the (test-mode) payment. */
@Component({
  selector: 'yb-checkout-page',
  imports: [ReactiveFormsModule, IconDirective, StepsBarComponent, EmptyStateComponent, FareBreakdownComponent, FmtDatePipe, InitialsPipe, NprPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './checkout.page.html',
})
export class CheckoutPage {
  private api = inject(CheckoutApi);
  private trips = inject(TripsApi);
  private state = inject(BookingStateStore);
  protected session = inject(SessionStore);
  private metaStore = inject(MetaStore);
  private modal = inject(ModalService);
  private toast = inject(ToastService);
  private auth = inject(AuthDialogService);
  private router = inject(Router);
  private fx = inject(PageFxService);
  private injector = inject(Injector);
  private fb = inject(NonNullableFormBuilder);
  private host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private payTpl = viewChild.required<TemplateRef<unknown>>('payBody');
  private payFoot = viewChild.required<TemplateRef<unknown>>('payFoot');
  private expiredTpl = viewChild.required<TemplateRef<unknown>>('expiredBody');
  private expiredFoot = viewChild.required<TemplateRef<unknown>>('expiredFoot');

  private readonly st = this.state.get();
  protected readonly legs: HeldLeg[] = this.st.legs || [];
  protected readonly empty = !this.legs.length || (!!this.st.search?.round && this.legs.length < 2);
  protected readonly n = this.legs[0]?.seats.length ?? 0;
  protected readonly genders = GENDERS;
  protected readonly gatewayBg = GATEWAY_BG;

  protected readonly meta = signal<Meta | null>(null);
  protected readonly left = signal('--:--');
  protected readonly urgent = signal(false);
  protected readonly coupon = signal(this.st.coupon || '');
  protected readonly couponInput = new FormControl('', { nonNullable: true });
  protected readonly couponError = signal('');
  protected readonly quote = signal<QuoteResponse | null>(null);
  protected readonly quoteError = signal('');
  protected readonly ladies = signal(new Set<number>());
  protected readonly notes = signal<PaxNote[]>([]);
  protected readonly invalid = signal<Partial<Record<string, boolean>>>({});
  protected readonly contactError = signal('');
  protected readonly paying = signal(false);
  protected readonly method = signal('eSewa');

  protected readonly pax = new FormArray<PaxGroup>([]);
  protected readonly phone = this.fb.control('');
  protected readonly email = this.fb.control('');
  protected readonly pm = this.fb.control('eSewa');
  protected readonly agree = this.fb.control(false);

  protected readonly fareLines = computed<FareLine[]>(() => (this.quote()?.legs || []).map((l, i) => ({ label: `${this.legs.length > 1 ? (i ? 'Return' : 'Outbound') + ' · ' : ''}Base fare (${l.seats.length} × seat)`, amount: l.subtotal })));
  protected readonly taxLabel = computed(() => `VAT (${Math.round((this.meta()?.tax ?? 0.13) * 100)}%)`);
  protected readonly applied = computed(() => !!this.coupon() && !!this.quote()?.coupon);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.timer));
    if (this.empty) { this.fx.ready(this.injector); return; }
    this.init();
  }

  private async init() {
    const user = this.session.user(), saved = this.st.pax ? [...this.st.pax] : [];
    let contact = this.st.contact;
    if (user) {
      if (!saved[0] || !saved[0].name) saved[0] = { ...(saved[0] || {}), name: user.name };
      contact = { phone: contact?.phone || user.phone, email: contact?.email || user.email };
    }
    this.legs[0].seats.forEach((_, i) => {
      const p = saved[i] || {};
      this.pax.push(this.fb.group({ name: p.name || '', age: this.fb.control<number | null>(p.age || null), gender: this.fb.control<Gender | ''>((p.gender as Gender) || '') }) as PaxGroup);
    });
    this.phone.setValue(contact?.phone || ''); this.email.setValue(contact?.email || '');
    this.couponInput.setValue(this.coupon());
    this.notes.set(this.legs[0].seats.map(() => ''));
    try { this.meta.set(await this.metaStore.load()); } catch (e) { this.quoteError.set((e as Error).message); }
    this.fx.ready(this.injector);

    // ladies seats (from the live layouts)
    const ladies = new Set<number>();
    await Promise.all(this.legs.map(async l => {
      try { const t = await this.trips.trip(l.scheduleId, l.date, l.holdId); t.layout.forEach(d => d.rows.flat().forEach(s => { if (s && s.ladies && l.seats.includes(s.id)) ladies.add(l.seats.indexOf(s.id)); })); } catch { /* layout optional */ }
    }));
    this.ladies.set(ladies); this.notes.update(n => n.map((x, i) => ladies.has(i) ? 'ladies-required' : x));

    this.startTimer();
    if (!user && !this.st.guest) setTimeout(() => this.offerLogin(), 250);
    this.refresh();
    // save as you type
    merge(this.pax.valueChanges, this.phone.valueChanges, this.email.valueChanges).pipe(debounceTime(300)).subscribe(() => this.save());
  }

  private offerLogin() {
    this.auth.open({ mode: 'login', guest: true, reason: 'Log in to save this trip to your account and check out faster — or continue as a guest.' }).then(r => {
      if (r === 'guest') { this.state.set({ guest: true }); this.toast.show('Continuing as guest'); }
      else if (r) { const c = this.state.get(); this.state.set({ contact: { phone: c.contact?.phone || r.phone, email: c.contact?.email || r.email } }); this.fx.reload(); }
    });
  }
  private startTimer() {
    const expires = Math.min(...this.legs.map(l => l.expiresAt));
    const tick = () => {
      const left = Math.max(0, expires - Date.now());
      this.left.set(`${pad(Math.floor(left / 60000))}:${pad(Math.floor(left / 1000) % 60)}`); this.urgent.set(left < 120000);
      if (left <= 0) { clearInterval(this.timer); this.modal.open({ title: 'Seat hold expired', body: this.expiredTpl(), foot: this.expiredFoot() }); }
    };
    tick(); this.timer = setInterval(tick, 1000);
  }
  protected chooseAgain() { this.modal.dismiss(); this.router.navigate(['/seats'], { queryParams: { id: this.legs[0].scheduleId, date: this.legs[0].date, leg: 0 } }); }

  // ---- coupon + quote
  private legBody(): LegRequest[] { return this.legs.map(l => ({ scheduleId: l.scheduleId, date: l.date, seats: l.seats, holdId: l.holdId, boarding: l.boarding, dropping: l.dropping })); }
  protected async refresh(announce = false) {
    try {
      let coupon = this.coupon();
      const qt = await this.api.quote(this.legBody(), coupon);
      if (coupon && qt.couponError) {
        const bad = coupon; coupon = ''; this.coupon.set(''); this.couponInput.setValue(bad); this.couponError.set(qt.couponError);
        if (announce) this.toast.error(qt.couponError);
        this.quote.set(await this.api.quote(this.legBody(), ''));
      } else {
        if (announce && coupon) this.toast.success(`${coupon} applied — you saved ${npr(qt.discount)}!`);
        this.state.set({ coupon }); this.couponError.set(''); this.quote.set(qt);
        if (!coupon) this.couponInput.setValue('');
      }
      this.quoteError.set('');
    } catch (e) { this.quoteError.set((e as Error).message); }
  }
  protected apply() { this.coupon.set(this.couponInput.value.trim().toUpperCase()); this.refresh(true); }
  protected useCode(code: string) { this.coupon.set(code); this.refresh(true); }
  protected removeCoupon() { this.coupon.set(''); this.state.set({ coupon: '' }); this.refresh(); this.toast.show('Coupon removed'); }
  protected couponKey(e: KeyboardEvent) { if (e.key === 'Enter') { e.preventDefault(); this.apply(); } }

  // ---- passengers
  private collect() { return this.pax.controls.map(g => ({ name: g.controls.name.value.trim(), age: Number(g.controls.age.value ?? 0), gender: g.controls.gender.value })); }
  private save() { this.state.set({ pax: this.collect().map(p => ({ ...p, gender: p.gender || undefined })), contact: { phone: this.phone.value.trim(), email: this.email.value.trim() } }); }
  protected seatsFor(i: number) { return this.legs.map(l => l.seats[i]).join(' / '); }
  protected seatLink(i: number) { const l = this.legs[i]; return '#/seats?' + qs({ id: l.scheduleId, date: l.date, leg: i }); }

  protected pay() {
    const P = this.collect(), ladies = this.ladies(), inv: Record<string, boolean> = {};
    let ok = true, first: string | null = null;
    const mark = (id: string, bad: boolean) => { inv[id] = bad; if (bad) { ok = false; first ??= '#' + id; } };
    const notes = P.map((p, i): PaxNote => {
      mark('pn' + i, p.name.length < 2); mark('pa' + i, !(p.age >= 1 && p.age <= 110));
      const ladyBad = ladies.has(i) && !!p.gender && p.gender !== 'F';
      if (!p.gender || ladyBad) { ok = false; first ??= `input[name=pg${i}]`; }
      return !p.gender ? 'gender' : ladyBad ? 'lady-bad' : ladies.has(i) ? 'ladies' : '';
    });
    const phone = this.phone.value.trim(), email = this.email.value.trim();
    mark('phone', !PHONE.test(phone)); mark('email', !!email && !EMAIL.test(email));
    this.invalid.set(inv); this.notes.set(notes);
    this.contactError.set(!PHONE.test(phone) ? 'Enter a valid 10-digit mobile number starting with 98, 97 or 96' : email && !EMAIL.test(email) ? 'Enter a valid email' : '');
    if (!ok) {
      this.toast.error('Please fix the highlighted fields');
      const el = this.host.querySelector<HTMLElement>(first!); el?.focus(); el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (!this.agree.value) { this.toast.error('Please accept the cancellation policy to continue'); this.host.querySelector<HTMLElement>('#agree')?.focus(); return; }
    this.method.set(this.pm.value);
    this.modal.open({ title: `Pay with ${this.pm.value}`, body: this.payTpl(), foot: this.payFoot() });
  }
  protected async confirmPay() {
    const P = this.collect() as { name: string; age: number; gender: Gender }[], phone = this.phone.value.trim(), email = this.email.value.trim();
    this.paying.set(true);
    await wait(900);
    try {
      const bk = await this.api.book({ legs: this.legBody(), coupon: this.coupon(), passengers: P, phone, email, payment: this.method() });
      this.modal.close(); clearInterval(this.timer);
      this.state.replace({ search: this.state.get().search, contact: { phone, email } });
      this.toast.success('Payment successful — booking confirmed!');
      this.router.navigate(['/ticket'], { queryParams: { id: bk.id, phone, new: 1 } });
    } catch (err) {
      this.paying.set(false); this.modal.close(); this.toast.error((err as Error).message, 5000);
      if (err instanceof ApiError && err.status === 410) this.router.navigate(['/seats'], { queryParams: { id: this.legs[0].scheduleId, date: this.legs[0].date, leg: 0 } });
    }
  }
}
