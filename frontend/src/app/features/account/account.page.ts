import { ChangeDetectionStrategy, Component, ElementRef, Injector, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageFxService } from '../../core/routing/page-fx.service';
import { injectQuery } from '../../core/routing/query';
import { SessionStore } from '../../core/state/session.store';
import { ToastService } from '../../core/services/toast.service';
import { ApiError } from '../../core/services/api.service';
import { BookingsApi } from '../../core/data-access/bookings.api';
import type { Booking } from '../../core/models/api.models';
import { EMAIL_RE, PHONE_RE, firstName, qs } from '../../core/utils/format';
import { AuthDialogService } from '../auth/data-access/auth-dialog.service';
import { IconDirective } from '../../shared/ui/icon/icon.directive';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { CountUpDirective } from '../../shared/directives/count-up.directive';
import { TextFieldComponent } from '../../shared/ui/form-field/text-field.component';
import { PasswordFieldComponent } from '../../shared/ui/form-field/password-field.component';
import { FmtDatePipe, InitialsPipe, NprPipe } from '../../shared/pipes/format.pipes';
import { AccountApi } from './data-access/account.api';

type Errs = Record<string, string>;
const departs = (b: Booking) => new Date(b.legs[0].date + 'T' + b.legs[0].snapshot.departure + ':00+05:45');

/** #/account?tab=bookings|profile|security — trips, profile editing and password change for the signed-in customer. */
@Component({
  selector: 'yb-account-page',
  imports: [ReactiveFormsModule, IconDirective, EmptyStateComponent, CountUpDirective, TextFieldComponent, PasswordFieldComponent, FmtDatePipe, InitialsPipe, NprPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './account.page.html',
})
export class AccountPage {
  protected session = inject(SessionStore);
  private bookings = inject(BookingsApi);
  private api = inject(AccountApi);
  private auth = inject(AuthDialogService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private fx = inject(PageFxService);
  private injector = inject(Injector);
  private fb = inject(NonNullableFormBuilder);
  private host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  protected readonly tab = injectQuery()['tab'] || 'bookings';
  protected readonly tabs = [['bookings', 'My bookings'], ['profile', 'Profile'], ['security', 'Password & security']];
  protected readonly list = signal<Booking[] | null>(null);
  protected readonly error = signal('');
  private readonly now = new Date();
  protected readonly upcoming = computed(() => (this.list() || []).filter(b => b.status === 'confirmed' && departs(b) > this.now).length);
  protected readonly spent = computed(() => (this.list() || []).filter(b => b.status === 'confirmed').reduce((a, b) => a + b.fare.total, 0));
  protected readonly first = computed(() => firstName(this.session.user()?.name || ''));
  protected readonly since = computed(() => { const u = this.session.user(); return u ? new Date(u.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : ''; });

  protected readonly profile = this.fb.group({ name: '', email: '', phone: '' });
  protected readonly password = this.fb.group({ current: '', password: '', confirm: '' });
  protected readonly errs = signal<Errs>({});
  protected readonly busy = signal(false);

  constructor() {
    const u = this.session.user();
    if (!u) { this.fx.ready(this.injector); return; }
    this.profile.setValue({ name: u.name, email: u.email, phone: u.phone });
    this.bookings.mine().then(l => this.list.set(l), e => this.error.set(e.message)).finally(() => this.fx.ready(this.injector));
  }

  protected login(mode: 'login' | 'signup') { this.auth.open({ mode }).then(u => u && this.fx.reload()); }
  protected go(tab: string) { this.router.navigate(['/account'], { queryParams: { tab } }); }
  protected past(b: Booking) { return departs(b) < this.now; }
  protected link(path: string, b: Booking) { return `#/${path}?` + qs({ id: b.id, phone: b.phone }); }
  protected logout() { this.auth.logout(); }

  protected async saveProfile(e: Event) {
    e.preventDefault();
    const v = this.profile.getRawValue(), d = { name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim() };
    const errs: Errs = { p_name: d.name.length < 2 ? 'Please enter your full name' : '', p_email: !EMAIL_RE.test(d.email) ? 'Enter a valid email' : '', p_phone: !PHONE_RE.test(d.phone) ? 'Enter a valid mobile number' : '' };
    if (!this.showErrors(errs)) return;
    this.busy.set(true);
    try { this.session.set((await this.api.update(d)).user); this.toast.success('Profile updated'); this.fx.reload(); }
    catch (err) { this.busy.set(false); this.showErrors({ p_name: '', p_email: '', p_phone: '', ['p_' + ((err as ApiError).data?.field || 'name')]: (err as Error).message }); }
  }
  protected async savePassword(e: Event, form: HTMLFormElement) {
    e.preventDefault();
    const d = this.password.getRawValue();
    const errs: Errs = {
      c_cur: !d.current ? 'Enter your current password' : '',
      c_new: d.password.length < 8 || !/[A-Za-z]/.test(d.password) || !/\d/.test(d.password) ? 'Use at least 8 characters with letters and numbers' : '',
      c_conf: d.password !== d.confirm ? 'Passwords do not match' : '',
    };
    if (!this.showErrors(errs)) return;
    this.busy.set(true);
    try { await this.api.changePassword(d); this.busy.set(false); this.password.reset(); form.reset(); this.toast.success('Password updated'); }
    catch (err) {
      this.busy.set(false);
      const key = ({ current: 'c_cur', password: 'c_new', confirm: 'c_conf' } as Errs)[(err as ApiError).data?.field] || 'c_cur';
      this.showErrors({ c_cur: '', c_new: '', c_conf: '', [key]: (err as Error).message });
    }
  }
  /** Show inline errors and focus the first invalid field; returns true when there are none. */
  private showErrors(errs: Errs) {
    this.errs.set(errs);
    const first = Object.keys(errs).find(k => errs[k]);
    if (first) setTimeout(() => this.host.parentElement?.querySelector<HTMLElement>('#' + first)?.focus());
    return !first;
  }
}
