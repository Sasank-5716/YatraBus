import { Routes } from '@angular/router';
import { pageTransitionGuard } from '../../core/routing/page-leave.guard';
import { SeatSelectionPage } from './seat-selection.page';

export default [{ path: '', component: SeatSelectionPage, canActivate: [pageTransitionGuard] }] satisfies Routes;
