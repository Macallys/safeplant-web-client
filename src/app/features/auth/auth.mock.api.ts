import { Injectable, InjectionToken } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { AuthApiContract } from './auth.api';
import {
  CreateUserAccountRequest,
  SignInRequest,
  SignInResponse,
  UserAccountResponse,
} from './auth.models';

export const AUTH_API = new InjectionToken<AuthApiContract>('AUTH_API');

@Injectable()
export class AuthMockApi implements AuthApiContract {
  signIn(_req: SignInRequest): Observable<SignInResponse> {
    return of<SignInResponse>({
      accessToken: 'mock-access-token',
      role: 'PlantManager',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }).pipe(delay(800));
  }

  createUserAccount(req: CreateUserAccountRequest): Observable<UserAccountResponse> {
    return of<UserAccountResponse>({
      id: 'mock-id-001',
      email: req.email,
      role: req.role,
      enabled: true,
    }).pipe(delay(800));
  }
}
