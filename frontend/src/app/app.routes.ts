import { Routes } from '@angular/router';

/** Feature routes — each feature is a lazily loaded chunk with its own routes file. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', loadChildren: () => import('./features/home/home.routes') },
  { path: 'search', loadChildren: () => import('./features/search-results/search-results.routes') },
  { path: 'seats', loadChildren: () => import('./features/seat-selection/seat-selection.routes') },
  { path: 'checkout', loadChildren: () => import('./features/checkout/checkout.routes') },
  { path: 'ticket', loadChildren: () => import('./features/ticket/ticket.routes') },
  { path: 'manage', loadChildren: () => import('./features/manage-booking/manage-booking.routes') },
  { path: 'account', loadChildren: () => import('./features/account/account.routes') },
  { path: 'admin', loadChildren: () => import('./features/admin/admin.routes') },
  { path: '**', loadChildren: () => import('./features/not-found/not-found.page') },
];
