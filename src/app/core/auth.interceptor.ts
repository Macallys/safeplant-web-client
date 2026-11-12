import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Session } from './session';

// Every call carries the bearer except login, recovery and reset (docs/web-client.md).
const PUBLIC_PATHS = ['/api/v1/auth/login', '/api/v1/auth/recovery', '/api/v1/auth/reset'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(Session);
  const router = inject(Router);
  const token = session.accessToken();
  const anonymous = PUBLIC_PATHS.some((path) => req.url.endsWith(path));
  const outgoing =
    token && !anonymous
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !anonymous) {
        session.clear();
        void router.navigateByUrl('/signIn');
      }

      return throwError(() => error);
    }),
  );
};
