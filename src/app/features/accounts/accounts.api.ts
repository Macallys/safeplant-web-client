import { inject, InjectionToken, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AssignUserRoleRequest,
  CreateUserAccountRequest,
  UserAccountResponse,
  UserAccountsDirectoryResponse,
} from './accounts.models';

export interface AccountsApiContract {
  getDirectory(): Observable<UserAccountsDirectoryResponse>;
  assignRole(accountId: string, req: AssignUserRoleRequest): Observable<UserAccountResponse>;
  createAccount(req: CreateUserAccountRequest): Observable<UserAccountResponse>;
}

export const ACCOUNTS_API = new InjectionToken<AccountsApiContract>('ACCOUNTS_API');

@Service()
export class AccountsApi implements AccountsApiContract {
  private readonly http = inject(HttpClient);

  getDirectory(): Observable<UserAccountsDirectoryResponse> {
    // TODO(backend): path is "To discuss" in docs/api-dtos.md (UserAccountsDirectory).
    return this.http.get<UserAccountsDirectoryResponse>(`${environment.apiBaseUrl}/api/v1/users`);
  }

  assignRole(accountId: string, req: AssignUserRoleRequest): Observable<UserAccountResponse> {
    // TODO(backend): path is "To discuss" in docs/api-dtos.md (AssignUserRole).
    return this.http.patch<UserAccountResponse>(
      `${environment.apiBaseUrl}/api/v1/users/${encodeURIComponent(accountId)}/role`,
      req,
    );
  }

  createAccount(req: CreateUserAccountRequest): Observable<UserAccountResponse> {
    // TODO(backend): path is "To discuss" in docs/api-dtos.md (CreateUserAccount).
    return this.http.post<UserAccountResponse>(`${environment.apiBaseUrl}/api/v1/users`, req);
  }
}
