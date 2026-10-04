export type UserRole = 'Supervisor' | 'PlantManager';

export type SessionChannel = 'Mobile' | 'Web';

export interface SignInRequest {
  email: string;
  password: string;
  channel: SessionChannel;
}

export interface SignInResponse {
  accessToken: string;
  role: UserRole;
  expiresAt: string;
  // TODO(backend): refreshToken and expiresIn are "To discuss" in SignIn — add when closed
}

export interface CreateUserAccountRequest {
  email: string;
  password: string;
  role: UserRole;
  // TODO(backend): name is "To discuss" in CreateUserAccount — add when field is closed
  name?: string;
}

export interface UserAccountResponse {
  id: string;
  email: string;
  role: UserRole;
  enabled: boolean;
}

export interface ApiError {
  code: string;
  correlationId: string | null;
}
