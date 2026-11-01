import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { SessionStore } from '../../../core/state/session.store';
import { BookingStateStore } from '../../../core/state/booking-state.store';
import { PageFxService } from '../../../core/routing/page-fx.service';
import type { User } from '../../../core/models/api.models';
import { AuthDialogComponent } from '../ui/auth-dialog.component';

export interface AuthDialogOptions { mode?: 'login' | 'signup'; guest?: boolean; reason?: string; }
export type AuthResult = User | 'guest' | null;

/** Opens the login / sign-up dialog and handles logout. */
@Injectable({ providedIn: 'root' })
export class AuthDialogService {
  private modal = inject(ModalService);
  private toast = inject(ToastService);
  private session = inject(SessionStore);
  private state = inject(BookingStateStore);
  private router = inject(Router);
  private fx = inject(PageFxService);

  open({ mode = 'login', guest = false, reason = '' }: AuthDialogOptions = {}): Promise<AuthResult> {
    return new Promise(resolve => {
      let done = false; const finish = (v: AuthResult) => { if (!done) { done = true; resolve(v); } };
      this.modal.open({ title: 'Welcome to Yatra Bus', body: AuthDialogComponent, inputs: { mode, guest, reason, finish }, onClose: () => finish(null) });
    });
  }
  async logout() {
    await this.session.logout();
    this.toast.success('You have been logged out');
    this.state.forgetPerson();
    if (this.router.url.startsWith('/account')) this.router.navigateByUrl('/'); else this.fx.reload();
  }
}
