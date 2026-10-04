import { inject, Injectable, signal } from '@angular/core';
import { Session } from '../../core/session';
import { AUTH_API } from './auth.mock.api';
import { CreateUserAccountRequest, SignInResponse, UserAccountResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AUTH_API);
  private readonly session = inject(Session);

  // Sign-in
  readonly signInLoading = signal(false);
  readonly signInError = signal<string | null>(null);
  readonly signedIn = signal(false);

  // Sign-up
  readonly signUpLoading = signal(false);
  readonly signUpError = signal<string | null>(null);
  readonly createdAccount = signal<UserAccountResponse | null>(null);

  signIn(email: string, password: string): void {
    this.signInLoading.set(true);
    this.signInError.set(null);
    this.signedIn.set(false);

    this.api.signIn({ email, password, channel: 'Web' }).subscribe({
      next: (res) => this.handleSignIn(res, email),
      error: () => {
        this.signInError.set('No se pudo iniciar sesión. Verifica tus datos e inténtalo de nuevo.');
        this.signInLoading.set(false);
      },
    });
  }

  createAccount(req: CreateUserAccountRequest): void {
    this.signUpLoading.set(true);
    this.signUpError.set(null);

    this.api.createUserAccount(req).subscribe({
      next: (account) => {
        this.createdAccount.set(account);
        this.signUpLoading.set(false);
      },
      error: (err) => {
        this.signUpError.set(this.mapSignUpError(err));
        this.signUpLoading.set(false);
      },
    });
  }

  private handleSignIn(res: SignInResponse, email: string): void {
    this.signInLoading.set(false);
    // Only PlantManager may enter the governance shell (docs/web-client.md).
    if (res.role !== 'PlantManager') {
      this.session.clear();
      this.signInError.set('Esta cuenta no tiene acceso al cliente web.');
      return;
    }
    this.session.start({ accessToken: res.accessToken, expiresAt: res.expiresAt, email });
    this.signedIn.set(true);
  }

  private mapSignUpError(err: unknown): string {
    const status = (err as { status?: number })?.status;
    if (status === 409) return 'Ya existe una cuenta con ese correo electrónico.';
    return 'No se pudo crear la cuenta. Inténtalo de nuevo.';
  }
}
