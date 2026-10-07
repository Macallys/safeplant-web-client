import { Component, ElementRef, computed, effect, inject, model, output, signal, viewChild } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormField, email, form, required } from '@angular/forms/signals';
import { ACCOUNTS_API } from '../accounts.api';
import { UserAccountResponse, UserRole } from '../accounts.models';

interface NewAccountModel {
  email: string;
  role: UserRole;
}

const ROLE_OPTIONS: { value: UserRole; label: string; action: string; permissions: string }[] = [
  {
    value: 'Supervisor',
    label: 'Supervisor',
    action: 'Crear supervisor y ver clave',
    permissions:
      'Vigilancia de indicadores en tiempo real, registro de notas de turno y reconocimiento de alertas sonoras en sala de control.',
  },
  {
    value: 'PlantManager',
    label: 'Encargado de planta',
    action: 'Crear encargado y ver clave',
    permissions:
      'Gobierno de cuentas y roles, y consulta del dashboard de métricas e historial de planta desde el cliente web.',
  },
];

// Unambiguous alphabet (no 0/O, 1/I/L) so the key can be dictated or copied by hand.
const KEY_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateTemporaryKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = Array.from(bytes, (b) => KEY_ALPHABET[b % KEY_ALPHABET.length]).join('');
  return `SEC-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}`;
}

@Component({
  selector: 'app-create-account-drawer',
  imports: [NgOptimizedImage, FormField],
  templateUrl: './create-account-drawer.html',
})
export class CreateAccountDrawer {
  private readonly api = inject(ACCOUNTS_API);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly open = model(false);
  readonly created = output<UserAccountResponse>();

  protected readonly roles = ROLE_OPTIONS;

  private readonly model = signal<NewAccountModel>({ email: '', role: 'Supervisor' });
  protected readonly accountForm = form(this.model, (path) => {
    required(path.email);
    email(path.email);
  });

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  // Set only after CreateUserAccount succeeds; the key is never shown for an account that does not exist.
  protected readonly result = signal<{ account: UserAccountResponse; key: string } | null>(null);
  protected readonly copied = signal(false);

  protected readonly selectedRole = computed(
    () => ROLE_OPTIONS.find((r) => r.value === this.model().role) ?? ROLE_OPTIONS[0],
  );

  protected readonly emailInvalid = computed(() => {
    const field = this.accountForm.email();
    return field.invalid() && field.touched();
  });

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) {
        this.reset();
        dialog.showModal();
      } else if (!this.open() && dialog.open) {
        dialog.close();
      }
    });
  }

  protected selectRole(role: UserRole): void {
    this.model.update((m) => ({ ...m, role }));
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.saving() || this.result()) return;

    this.accountForm.email().markAsTouched();
    if (this.accountForm().invalid()) return;

    const { email, role } = this.model();
    const key = generateTemporaryKey();
    this.saving.set(true);
    this.error.set(null);

    // CreateUserAccount takes `password`; the temporary key travels as that password.
    this.api.createAccount({ email: email.trim(), password: key, role }).subscribe({
      next: (account) => {
        this.saving.set(false);
        this.result.set({ account, key });
        this.created.emit(account);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(
          (err as { status?: number })?.status === 409
            ? 'Ya existe una cuenta con ese correo electrónico.'
            : 'No se pudo crear la cuenta. Inténtalo de nuevo.',
        );
      },
    });
  }

  protected async copyKey(): Promise<void> {
    const key = this.result()?.key;
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }

  protected close(): void {
    if (this.saving()) return;
    this.open.set(false);
  }

  // Escape fires `cancel`; block it mid-request so the call is not orphaned.
  protected onCancel(event: Event): void {
    if (this.saving()) event.preventDefault();
  }

  protected onClosed(): void {
    this.open.set(false);
  }

  private reset(): void {
    this.model.set({ email: '', role: 'Supervisor' });
    this.accountForm().reset();
    this.error.set(null);
    this.result.set(null);
    this.copied.set(false);
  }
}
