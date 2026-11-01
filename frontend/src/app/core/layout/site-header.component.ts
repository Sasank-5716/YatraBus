import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SessionStore } from '../state/session.store';
import { AuthDialogService } from '../../features/auth/data-access/auth-dialog.service';
import { IconDirective } from '../../shared/ui/icon/icon.directive';
import { InitialsPipe } from '../../shared/pipes/format.pipes';
import { firstName } from '../utils/format';

/** Sticky site header: brand, main nav (mobile toggle), and the login buttons / user menu. */
@Component({
  selector: 'header[ybSiteHeader]',
  imports: [IconDirective, InitialsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'outside($event)', '(document:keydown.escape)': 'menuOpen.set(false)' },
  templateUrl: './site-header.component.html',
})
export class SiteHeaderComponent {
  protected session = inject(SessionStore);
  private auth = inject(AuthDialogService);
  private host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  protected readonly navOpen = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly active = signal('home');
  protected readonly first = computed(() => firstName(this.session.user()?.name || ''));

  constructor() {
    const router = inject(Router);
    router.events.subscribe(e => {
      if (!(e instanceof NavigationEnd)) return;
      const path = router.parseUrl(e.urlAfterRedirects).root.children['primary']?.segments[0]?.path || '';
      this.active.set(({ manage: 'manage', admin: 'admin', account: 'account' } as Record<string, string>)[path] || 'home');
      this.navOpen.set(false);
    });
  }
  protected open(mode: 'login' | 'signup') { this.auth.open({ mode }); }
  protected logout() { this.auth.logout(); }
  protected toggleMenu(e: Event) { e.stopPropagation(); this.menuOpen.update(v => !v); }
  protected menuClick(e: Event) { if ((e.target as Element).closest('a')) this.menuOpen.set(false); }
  protected outside(e: Event) { if (!(e.target as Element).closest?.('.user-menu')) this.menuOpen.set(false); }
}
