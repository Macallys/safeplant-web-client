import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Session } from './session';

// Every call carries the bearer except login, recovery and reset (docs/web-client.md).
const PUBLIC_PATHS = ['/api/v1/auth/login', '/api/v1/auth/recovery', '/api/v1/auth/reset'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(Session).accessToken();
  if (!token || PUBLIC_PATHS.some((path) => req.url.endsWith(path))) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
