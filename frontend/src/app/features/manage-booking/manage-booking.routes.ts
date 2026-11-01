import { Routes } from '@angular/router';
import { pageTransitionGuard } from '../../core/routing/page-leave.guard';
import { ManageBookingPage } from './manage-booking.page';

export default [{ path: '', component: ManageBookingPage, canActivate: [pageTransitionGuard] }] satisfies Routes;
