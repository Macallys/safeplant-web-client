import { Routes } from '@angular/router';
import { sessionGuard } from './core/session.guard';

export const routes: Routes = [
  {
    path: 'signIn',
    loadComponent: () =>
      import('./features/auth/sign-in/sign-in').then((m) => m.SignIn),
  },
  {
    path: 'signUp',
    loadComponent: () =>
      import('./features/auth/sign-up/sign-up').then((m) => m.SignUp),
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
  { path: '', redirectTo: 'signIn', pathMatch: 'full' },
];
