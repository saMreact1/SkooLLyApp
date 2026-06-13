import {ChangeDetectionStrategy, Component, Inject, inject, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {AuthService} from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  // Convenience getters
  get email() { return this.form.controls.email; }
  get password() { return this.form.controls.password; }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.auth.redirectToDashboard();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ?? 'Invalid Email or Password. Please try again.'
        )
      }
    });
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }
}
