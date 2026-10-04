import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { Header } from '../../../shared/header/header';
import { AuthStore } from '../auth.store';

@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, RouterLink, NgOptimizedImage, Header],
  templateUrl: './sign-in.html',
  host: { class: 'block min-h-screen bg-[#f8f9ff]' },
})
export class SignIn {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(AuthStore);

  protected readonly showPassword = signal(false);

  constructor() {
    const router = inject(Router);
    effect(() => {
      if (this.store.signedIn()) router.navigate(['/metrics']);
    });
  }

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected get emailInvalid(): boolean {
    const c = this.form.controls.email;
    return c.invalid && c.touched;
  }

  protected get passwordInvalid(): boolean {
    const c = this.form.controls.password;
    return c.invalid && c.touched;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.store.signIn(email, password);
  }
}
