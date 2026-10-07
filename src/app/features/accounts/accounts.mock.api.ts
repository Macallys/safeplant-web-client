import { Service } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { AccountsApiContract } from './accounts.api';
import {
  AssignUserRoleRequest,
  CreateUserAccountRequest,
  UserAccountResponse,
  UserAccountsDirectoryResponse,
} from './accounts.models';

// Sample payload with the exact shape of UserAccountsDirectory (docs/api-dtos.md).
// Only this file holds sample data; swap it for AccountsApi in app.config.ts.
const DIRECTORY: UserAccountsDirectoryResponse = {
  items: [
    { id: 'acc-001', email: 'supervisor.a@example.com', role: 'Supervisor', enabled: true },
    { id: 'acc-002', email: 'supervisor.b@example.com', role: 'Supervisor', enabled: true },
    { id: 'acc-003', email: 'supervisor.c@example.com', role: 'Supervisor', enabled: true },
    { id: 'acc-004', email: 'encargado.a@example.com', role: 'PlantManager', enabled: true },
  ],
};

@Service({ autoProvided: false })
export class AccountsMockApi implements AccountsApiContract {
  getDirectory(): Observable<UserAccountsDirectoryResponse> {
    return of(structuredClone(DIRECTORY)).pipe(delay(600));
  }

  assignRole(accountId: string, req: AssignUserRoleRequest): Observable<UserAccountResponse> {
    const account = DIRECTORY.items.find((a) => a.id === accountId);
    if (!account) return throwError(() => ({ status: 404 }));
    account.role = req.role;
    return of({ ...account }).pipe(delay(500));
  }

  createAccount(req: CreateUserAccountRequest): Observable<UserAccountResponse> {
    const email = req.email.trim().toLowerCase();
    // TODO(backend): duplicate email is 409, code "To discuss" (email_already_exists).
    if (DIRECTORY.items.some((a) => a.email.toLowerCase() === email)) {
      return throwError(() => ({ status: 409 }));
    }
    const account: UserAccountResponse = {
      id: `acc-${String(DIRECTORY.items.length + 1).padStart(3, '0')}`,
      email,
      role: req.role,
      enabled: true,
    };
    DIRECTORY.items.push(account);
    return of({ ...account }).pipe(delay(700));
  }
}
