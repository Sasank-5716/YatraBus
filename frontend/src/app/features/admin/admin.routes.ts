import { Routes } from '@angular/router';
import { pageTransitionGuard } from '../../core/routing/page-leave.guard';
import { AdminPage } from './admin.page';

export default [{ path: '', component: AdminPage, canActivate: [pageTransitionGuard] }] satisfies Routes;
