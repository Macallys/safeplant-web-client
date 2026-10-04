import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { AuthStore } from '../auth.store';
import { UserRole } from '../auth.models';
import { Header } from '../../../shared/header/header';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink, NgOptimizedImage, Header],
  templateUrl: './sign-up.html',
  host: { class: 'block min-h-screen bg-[#f8f9ff]' },
})
export class SignUp {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(AuthStore);

  protected readonly showPassword = signal(false);
  protected readonly showConfirm = signal(false);

  protected readonly roles: { value: UserRole; label: string }[] = [
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'PlantManager', label: 'Encargado de Planta' },
  ];

  protected readonly form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      role: ['Supervisor' as UserRole, [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  protected get emailInvalid(): boolean {
    const c = this.form.get('email')!;
    return c.invalid && c.touched;
  }

  protected get passwordInvalid(): boolean {
    const c = this.form.get('password')!;
    return c.invalid && c.touched;
  }

  protected get mismatch(): boolean {
    return this.form.hasError('passwordMismatch') && !!this.form.get('confirmPassword')?.touched;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password, role } = this.form.getRawValue();
    this.store.createAccount({ email: email!, password: password!, role: role! });
  }
}
