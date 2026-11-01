import { Routes } from '@angular/router';
import { pageTransitionGuard } from '../../core/routing/page-leave.guard';
import { AccountPage } from './account.page';

export default [{ path: '', component: AccountPage, canActivate: [pageTransitionGuard] }] satisfies Routes;
