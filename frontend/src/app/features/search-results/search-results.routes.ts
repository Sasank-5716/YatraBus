import { Routes } from '@angular/router';
import { pageTransitionGuard } from '../../core/routing/page-leave.guard';
import { SearchResultsPage } from './search-results.page';

export default [{ path: '', component: SearchResultsPage, canActivate: [pageTransitionGuard] }] satisfies Routes;
