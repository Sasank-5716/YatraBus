import { Routes } from '@angular/router';
import { pageTransitionGuard } from '../../core/routing/page-leave.guard';
import { CheckoutPage } from './checkout.page';

export default [{ path: '', component: CheckoutPage, canActivate: [pageTransitionGuard] }] satisfies Routes;
