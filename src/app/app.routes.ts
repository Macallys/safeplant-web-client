import { Routes } from '@angular/router';
import { sessionGuard } from './core/session.guard';

export const routes: Routes = [
  {
    path: 'signIn',
    loadComponent: () =>
      import('./features/auth/sign-in/sign-in').then((m) => m.SignIn),
  },
  {
    path: 'metrics',
    canActivate: [sessionGuard],
    loadComponent: () =>
      import('./features/metrics/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'metrics/:areaId/history',
    canActivate: [sessionGuard],
    loadComponent: () =>
      import('./features/metrics/history/history').then((m) => m.AlertsHistory),
  },
  {
    path: 'alerts',
    canActivate: [sessionGuard],
    loadComponent: () =>
      import('./features/metrics/history/history').then((m) => m.AlertsHistory),
  },
  {
    path: 'users',
    canActivate: [sessionGuard],
    loadComponent: () =>
      import('./features/accounts/directory/accounts').then((m) => m.Accounts),
  },
  { path: '', redirectTo: 'signIn', pathMatch: 'full' },
];
