import { Component, inject, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Session } from '../../core/session';

export type ShellSection = 'dashboard' | 'alerts' | 'accounts';

@Component({
  selector: 'app-shell',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './app-shell.html',
  host: { class: 'block min-h-screen bg-[#eff4ff]' },
})
export class AppShell {
  readonly active = input.required<ShellSection>();

  protected readonly email = inject(Session).email;
}
