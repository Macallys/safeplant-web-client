// UserAccountsDirectory, AssignUserRole and CreateUserAccount — docs/api-dtos.md (Identity & Access).
import { CreateUserAccountRequest, UserAccountResponse, UserRole } from '../auth/auth.models';

export type { CreateUserAccountRequest, UserAccountResponse, UserRole };

export interface UserAccountsDirectoryResponse {
  items: UserAccountResponse[];
  // TODO(backend): no paging or total count in the contract — the directory is a flat list.
}

export interface AssignUserRoleRequest {
  role: UserRole;
}
