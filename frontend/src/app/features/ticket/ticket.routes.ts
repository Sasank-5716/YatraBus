import { Routes } from '@angular/router';
import { pageTransitionGuard } from '../../core/routing/page-leave.guard';
import { TicketPage } from './ticket.page';

export default [{ path: '', component: TicketPage, canActivate: [pageTransitionGuard] }] satisfies Routes;
