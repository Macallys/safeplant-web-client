import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { AUTH_API, AuthMockApi } from './features/auth/auth.mock.api';
import { METRICS_API } from './features/metrics/metrics.api';
import { MetricsMockApi } from './features/metrics/metrics.mock.api';
import { ACCOUNTS_API } from './features/accounts/accounts.api';
import { AccountsMockApi } from './features/accounts/accounts.mock.api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    // TODO: swap mock → real: replace `useClass: AuthMockApi` with `useClass: AuthApi`
    // and import AuthApi from './features/auth/auth.api'
    { provide: AUTH_API, useClass: AuthMockApi },
    // TODO: swap mock → real: replace `useClass: MetricsMockApi` with `useClass: MetricsApi`
    // (import MetricsApi from './features/metrics/metrics.api')
    { provide: METRICS_API, useClass: MetricsMockApi },
    // TODO: swap mock → real: replace `useClass: AccountsMockApi` with `useClass: AccountsApi`
    // (import AccountsApi from './features/accounts/accounts.api')
    { provide: ACCOUNTS_API, useClass: AccountsMockApi },
  ],
};
