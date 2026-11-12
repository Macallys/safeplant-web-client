import { Component, inject, input, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthApi } from '../../features/auth/auth.api';
import { Session } from '../../core/session';

export type ShellSection = 'dashboard' | 'alerts' | 'accounts';

@Component({
  selector: 'app-shell',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './app-shell.html',
  host: { class: 'block min-h-screen bg-[#eff4ff]' },
})
export class AppShell {
  private readonly api = inject(AuthApi);
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  readonly active = input.required<ShellSection>();

  protected readonly email = this.session.email;
  protected readonly leaving = signal(false);

  protected logout(): void {
    if (this.leaving()) {
      return;
    }

    this.leaving.set(true);
    this.api.logout().subscribe({
      next: () => this.finish(),
      error: () => this.finish(),
    });
  }

  private finish(): void {
    this.session.clear();
    void this.router.navigateByUrl('/signIn');
  }
}
