import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateUserAccountRequest,
  SignInRequest,
  SignInResponse,
  UserAccountResponse,
} from './auth.models';

export interface AuthApiContract {
  signIn(req: SignInRequest): Observable<SignInResponse>;
  createUserAccount(req: CreateUserAccountRequest): Observable<UserAccountResponse>;
}

@Injectable({ providedIn: 'root' })
export class AuthApi implements AuthApiContract {
  private readonly http = inject(HttpClient);

  signIn(req: SignInRequest): Observable<SignInResponse> {
    return this.http.post<SignInResponse>(`${environment.apiBaseUrl}/api/v1/auth/login`, req);
  }

  createUserAccount(req: CreateUserAccountRequest): Observable<UserAccountResponse> {
    return this.http.post<UserAccountResponse>(`${environment.apiBaseUrl}/api/v1/users`, req);
  }
}
