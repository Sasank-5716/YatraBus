import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SessionStore } from '../../../../core/state/session.store';
import { EMAIL_RE } from '../../../../core/utils/format';
import { IconDirective } from '../../../../shared/ui/icon/icon.directive';

/** Festival-fares newsletter signup card. */
@Component({
  selector: 'form[ybNewsletter]',
  imports: [ReactiveFormsModule, IconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'news-card', 'id': 'news', 'novalidate': '', '(submit)': '$event.preventDefault(); submit()' },
  template: `<div class="news-deco" aria-hidden="true"></div>
    <div><span class="kicker light">Newsletter</span><h2>Get festival fares before anyone else</h2><p>Dashain, Tihar and Chhath deals straight to your inbox. No spam, unsubscribe anytime.</p></div>
    <div class="news-form"><label for="nemail" class="sr-only">Email address</label><input class="input" id="nemail" type="email" placeholder="you@example.com" autocomplete="email" [formControl]="email" [class.invalid]="invalid()"><button class="btn btn-light" [disabled]="busy()">@if (busy()) {<span class="spinner"></span> Subscribing…} @else {Subscribe <svg ybIcon="arrow"></svg>}</button><p class="err-text light" id="nerr">{{ error() }}</p></div>`,
})
export class NewsletterComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  protected readonly email = inject(NonNullableFormBuilder).control(inject(SessionStore).user()?.email || '');
  protected readonly error = signal('');
  protected readonly invalid = signal(false);
  protected readonly busy = signal(false);

  protected async submit() {
    const em = this.email.value.trim();
    if (!EMAIL_RE.test(em)) { this.error.set('Please enter a valid email address'); this.invalid.set(true); return; }
    this.error.set(''); this.invalid.set(false); this.busy.set(true);
    try {
      const r = await this.api.post<{ already?: boolean }>('/api/newsletter', { email: em }); this.busy.set(false);
      this.toast.success(r.already ? "You're already subscribed — thank you!" : 'Subscribed! Watch your inbox for festival fares.');
      this.email.setValue('');
    } catch (err) { this.busy.set(false); this.error.set((err as Error).message); }
  }
}
