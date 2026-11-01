import { Routes } from '@angular/router';
import { pageTransitionGuard } from '../../core/routing/page-leave.guard';
import { HomePage } from './home.page';

export default [{ path: '', component: HomePage, canActivate: [pageTransitionGuard] }] satisfies Routes;
