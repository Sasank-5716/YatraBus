import { ChangeDetectionStrategy, Component, ElementRef, OnInit, WritableSignal, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ModalRef } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { SessionStore } from '../../../core/state/session.store';
import { ApiError } from '../../../core/services/api.service';
import type { User } from '../../../core/models/api.models';
import { EMAIL_RE, PHONE_RE, PW_HINTS, firstName, pwStrength } from '../../../core/utils/format';
import { TextFieldComponent } from '../../../shared/ui/form-field/text-field.component';
import { PasswordFieldComponent } from '../../../shared/ui/form-field/password-field.component';
import { AuthApi } from '../data-access/auth.api';
import type { AuthResult } from '../data-access/auth-dialog.service';

type Errs = Record<string, string>;

/** Body of the auth modal: log in / create account tabs (+ optional "continue as guest"). */
@Component({
  selector: 'yb-auth-dialog',
  imports: [ReactiveFormsModule, TextFieldComponent, PasswordFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './auth-dialog.component.html',
})
export class AuthDialogComponent implements OnInit {
  readonly mode = input<'login' | 'signup'>('login');
  readonly guest = input(false);
  readonly reason = input('');
  readonly finish = input.required<(v: AuthResult) => void>();
  readonly modalRef = input.required<ModalRef>();

  private fb = inject(NonNullableFormBuilder);
  private api = inject(AuthApi);
  private session = inject(SessionStore);
  private toast = inject(ToastService);
  private host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;

  protected readonly tab = signal<'login' | 'signup'>('login');
  protected readonly loginErrs = signal<Errs>({});
  protected readonly signupErrs = signal<Errs>({});
  protected readonly loginError = signal('');
  protected readonly busy = signal<'' | 'login' | 'signup'>('');
  protected readonly strength = signal(0);
  protected readonly hints = PW_HINTS;

  protected readonly login = this.fb.group({ email: '', password: '' });
  protected readonly signup = this.fb.group({ name: '', email: '', phone: '', password: '', confirm: '' });

  ngOnInit() {
    this.tab.set(this.mode());
    this.signup.controls.password.valueChanges.subscribe(v => this.strength.set(v ? pwStrength(v) : 0));
    setTimeout(() => this.focus(this.mode() === 'login' ? 'l_email' : 's_name'), 40);
  }
  protected switch(m: 'login' | 'signup', e?: Event) { e?.preventDefault(); this.tab.set(m); setTimeout(() => this.focus(m === 'login' ? 'l_email' : 's_name'), 20); }

  protected async submitLogin() {
    const em = this.login.value.email!.trim(), pw = this.login.value.password!;
    const errs: Errs = { l_email: em ? '' : 'Enter your email or mobile number', l_pw: pw ? '' : 'Enter your password' };
    this.showErrors(this.loginErrs, errs); this.loginError.set('');
    if (this.hasErrors(errs)) return;
    this.busy.set('login');
    try { const r = await this.api.login(em, pw); this.ok(r.user, `Welcome back, ${firstName(r.user.name)}!`); }
    catch (err) {
      this.busy.set(''); this.loginError.set((err as Error).message); this.loginErrs.update(e => ({ ...e, l_pw: '' }));
      this.markInvalid('l_pw');
      const modal = this.host.closest('.modal') as HTMLElement | null;
      if (modal) { modal.classList.remove('shake'); void modal.offsetWidth; modal.classList.add('shake'); }
    }
  }
  protected async submitSignup() {
    const v = this.signup.getRawValue(), d = { ...v, name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim() };
    const errs: Errs = {
      s_name: d.name.length < 2 ? 'Please enter your full name' : '',
      s_email: !EMAIL_RE.test(d.email) ? 'Enter a valid email address' : '',
      s_phone: !PHONE_RE.test(d.phone) ? 'Enter a 10-digit number starting with 98, 97 or 96' : '',
      s_pw: d.password.length < 8 || !/[A-Za-z]/.test(d.password) || !/\d/.test(d.password) ? 'Use at least 8 characters with letters and numbers' : '',
      s_confirm: d.password !== d.confirm ? 'Passwords do not match' : '',
    };
    this.showErrors(this.signupErrs, errs); if (this.hasErrors(errs)) return;
    this.busy.set('signup');
    try { const r = await this.api.signup(d); this.ok(r.user, `Account created — welcome, ${firstName(r.user.name)}!`); }
    catch (err) {
      this.busy.set('');
      const map: Record<string, string> = { name: 's_name', email: 's_email', phone: 's_phone', password: 's_pw', confirm: 's_confirm' };
      const key = map[(err as ApiError).data?.field] || 's_name';
      this.showErrors(this.signupErrs, { s_name: '', s_email: '', s_phone: '', s_pw: '', s_confirm: '', [key]: (err as Error).message });
    }
  }
  protected asGuest() { this.finish()('guest'); this.modalRef().close(); }

  private ok(u: User, msg: string) { this.session.set(u); this.modalRef().close(); this.toast.success(msg); this.finish()(u); }
  private hasErrors(e: Errs) { return Object.values(e).some(Boolean); }
  private showErrors(target: WritableSignal<Errs>, errs: Errs) {
    target.set(errs);
    const first = Object.keys(errs).find(k => errs[k]); if (first) setTimeout(() => this.focus(first));
  }
  private markInvalid(id: string) { setTimeout(() => this.host.querySelector('#' + id)?.classList.add('invalid')); }
  private focus(id: string) { (this.host.parentElement?.querySelector('#' + id) as HTMLElement | null)?.focus(); }
}
