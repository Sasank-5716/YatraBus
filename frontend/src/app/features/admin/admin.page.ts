import { ChangeDetectionStrategy, Component, Injector, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { PageFxService } from '../../core/routing/page-fx.service';
import { injectQuery } from '../../core/routing/query';
import { AdminSessionStore } from '../../core/state/admin-session.store';
import { MetaStore } from '../../core/state/meta.store';
import { ModalService } from '../../core/services/modal.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiError } from '../../core/services/api.service';
import { IconDirective } from '../../shared/ui/icon/icon.directive';
import { AdminApi, Collection } from './data-access/admin.api';
import { AdminStore } from './data-access/admin.store';
import { AdminLoginComponent } from './ui/admin-login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminBookingsComponent } from './bookings/admin-bookings.component';
import { OccupancyComponent } from './occupancy/occupancy.component';
import { CatalogComponent } from './catalog/catalog.component';

export const ADMIN_TABS: [string, string, string][] = [['dashboard', 'Dashboard', 'chart'], ['bookings', 'Bookings', 'list'], ['occupancy', 'Seat occupancy', 'grid'], ['schedules', 'Schedules', 'cal'], ['buses', 'Buses', 'bus'], ['routes', 'Routes', 'map'], ['operators', 'Operators', 'users'], ['coupons', 'Coupons', 'tag']];

/** #/admin?tab=… — operator console shell: login gate, section nav, reset/logout; each section is a deferred chunk. */
@Component({
  selector: 'yb-admin-page',
  imports: [IconDirective, AdminLoginComponent, DashboardComponent, AdminBookingsComponent, OccupancyComponent, CatalogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './admin.page.html',
})
export class AdminPage {
  protected session = inject(AdminSessionStore);
  protected store = inject(AdminStore);
  private api = inject(AdminApi);
  private meta = inject(MetaStore);
  private modal = inject(ModalService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private fx = inject(PageFxService);
  private injector = inject(Injector);
  private resetBody = viewChild.required<TemplateRef<unknown>>('resetBody');
  private resetFoot = viewChild.required<TemplateRef<unknown>>('resetFoot');
  protected readonly q = injectQuery();
  protected readonly tab = this.q['tab'] || 'dashboard';
  protected readonly tabs = ADMIN_TABS;
  protected readonly ready = signal(false);
  protected readonly error = signal('');

  constructor() { this.open(); }
  protected get collection() { return this.tab as Collection; }

  protected async open() {
    if (!this.session.token()) { this.fx.ready(this.injector); return; }
    try { await this.store.load(); this.ready.set(true); }
    catch (e) {
      if (e instanceof ApiError && e.status === 401) this.session.clear(); else this.error.set((e as Error).message);
    }
    this.fx.ready(this.injector);
  }
  protected go(tab: string) { this.router.navigate(['/admin'], { queryParams: { tab } }); }
  protected logout() { this.session.clear(); this.toast.show('Logged out'); this.fx.reload(); }
  protected askReset() { this.modal.open({ title: 'Reset demo data?', body: this.resetBody(), foot: this.resetFoot() }); }
  protected async doReset() {
    await this.api.reset(); this.modal.close(); this.meta.invalidate(); this.toast.success('Demo data reset'); this.fx.reload();
  }
}
