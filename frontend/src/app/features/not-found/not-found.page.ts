import { ChangeDetectionStrategy, Component, Injector, inject } from '@angular/core';
import { Routes } from '@angular/router';
import { PageFxService } from '../../core/routing/page-fx.service';
import { pageTransitionGuard } from '../../core/routing/page-leave.guard';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'yb-not-found-page',
  imports: [EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  template: `<div class="container page"><div class="card empty" ybEmpty icon="compass"><h3>Page not found</h3><a class="btn btn-primary" href="#/">Go home</a></div></div>`,
})
export class NotFoundPage { constructor() { inject(PageFxService).ready(inject(Injector)); } }

export default [{ path: '', component: NotFoundPage, canActivate: [pageTransitionGuard] }] satisfies Routes;
