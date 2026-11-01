import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { AdminSessionStore } from '../../../core/state/admin-session.store';
import { AdminApi } from '../data-access/admin.api';

/** Operator password form (demo password: admin). */
@Component({
  selector: 'yb-admin-login',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  template: `<div class="container page"><form class="card login-box" id="al" ngNativeValidate [formGroup]="form" (ngSubmit)="submit()"><div class="center" style="margin-bottom:16px"><span class="brand-mark" style="display:inline-block;width:48px;height:48px;background-size:36px"></span><h2 style="margin-top:12px">Operator login</h2><p class="muted small">Demo password: <code>admin</code></p></div>
  <div class="field"><label for="pw">Password</label><input #pw class="input" type="password" id="pw" autocomplete="current-password" formControlName="password" [class.invalid]="invalid()" required></div><p class="err-text" id="ae" role="alert">{{ error() }}</p><button class="btn btn-primary btn-block btn-lg" [disabled]="busy()">@if (busy()) {<span class="spinner"></span> Signing in…} @else {Log in}</button></form></div>`,
})
export class AdminLoginComponent implements AfterViewInit {
  readonly loggedIn = output<void>();
  private api = inject(AdminApi);
  private session = inject(AdminSessionStore);
  private toast = inject(ToastService);
  private pw = viewChild.required<ElementRef<HTMLInputElement>>('pw');
  protected readonly form = inject(NonNullableFormBuilder).group({ password: '' });
  protected readonly error = signal('');
  protected readonly invalid = signal(false);
  protected readonly busy = signal(false);
  ngAfterViewInit() { this.pw().nativeElement.focus(); }
  protected async submit() {
    this.busy.set(true);
    try {
      const r = await this.api.login(this.form.getRawValue().password);
      this.session.set(r.token); this.toast.success('Welcome back!'); this.loggedIn.emit();
    } catch (err) { this.busy.set(false); this.error.set((err as Error).message); this.invalid.set(true); }
  }
}
