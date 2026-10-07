import { Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { AppShell } from '../../../shared/app-shell/app-shell';
import { ACCOUNTS_API } from '../accounts.api';
import { CreateAccountDrawer } from '../create-account/create-account-drawer';
import { UserAccountResponse, UserRole } from '../accounts.models';

type LoadState = 'loading' | 'ready' | 'error';

const ROLE_LABELS: Record<UserRole, string> = {
  Supervisor: 'Supervisor',
  PlantManager: 'Encargado de planta',
};

@Component({
  selector: 'app-accounts',
  imports: [NgOptimizedImage, AppShell, CreateAccountDrawer],
  templateUrl: './accounts.html',
  host: { class: 'block' },
})
export class Accounts {
  private readonly api = inject(ACCOUNTS_API);

  protected readonly roles = Object.entries(ROLE_LABELS).map(([value, label]) => ({
    value: value as UserRole,
    label,
  }));

  protected readonly state = signal<LoadState>('loading');
  protected readonly items = signal<UserAccountResponse[]>([]);
  protected readonly query = signal('');

  // Inline role edit (AssignUserRole): one row at a time.
  protected readonly editingId = signal<string | null>(null);
  protected readonly draftRole = signal<UserRole>('Supervisor');
  protected readonly saving = signal(false);
  protected readonly saveError = signal(false);

  // CreateUserAccount drawer; the account is created only from its submit button.
  protected readonly creating = signal(false);

  protected readonly activeUsers = computed(() => this.items().filter((a) => a.enabled).length);

  // Client-side filter over the loaded list; `email` is the only searchable field in the contract.
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.items().filter((a) => a.email.toLowerCase().includes(q)) : this.items();
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.getDirectory().subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected onCreated(account: UserAccountResponse): void {
    this.items.update((list) => [...list, account]);
  }

  protected roleLabel(role: UserRole): string {
    return ROLE_LABELS[role];
  }

  // TODO(backend): `name` is "To discuss" in CreateUserAccount; initials come from the email until then.
  protected initials(email: string): string {
    return email.slice(0, 2).toUpperCase();
  }

  protected startEdit(account: UserAccountResponse): void {
    this.editingId.set(account.id);
    this.draftRole.set(account.role);
    this.saveError.set(false);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.saveError.set(false);
  }

  protected saveRole(account: UserAccountResponse): void {
    if (this.draftRole() === account.role) {
      this.cancelEdit();
      return;
    }
    this.saving.set(true);
    this.saveError.set(false);
    this.api.assignRole(account.id, { role: this.draftRole() }).subscribe({
      next: (updated) => {
        this.items.update((list) => list.map((a) => (a.id === updated.id ? updated : a)));
        this.saving.set(false);
        this.editingId.set(null);
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set(true);
      },
    });
  }
}
