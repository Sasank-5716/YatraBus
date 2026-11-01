import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

/**
 * Every navigation (including query-only changes such as a new search date or admin tab) creates a fresh page component,
 * matching v5 where each hash change re-rendered the view from scratch.
 */
export class FreshPageStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot) {
    return future.routeConfig === curr.routeConfig && !future.routeConfig?.loadComponent && !future.routeConfig?.component;
  }
}
