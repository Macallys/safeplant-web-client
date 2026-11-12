import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { AUTH_API } from './features/auth/auth.mock.api';
import { AuthApi } from './features/auth/auth.api';
import { METRICS_API, MetricsApi } from './features/metrics/metrics.api';
import { ACCOUNTS_API, AccountsApi } from './features/accounts/accounts.api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: AUTH_API, useClass: AuthApi },
    { provide: METRICS_API, useClass: MetricsApi },
    { provide: ACCOUNTS_API, useClass: AccountsApi },
  ],
};
