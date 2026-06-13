import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  Signal,
  signal, ViewEncapsulation
} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {AuthService} from '../../../../../../core/auth/services/auth.service';
import {Router} from '@angular/router';
import {RegistrationState} from '../../../../../../core/auth/models/auth.model';

@Component({
  selector: 'app-step1-check',
  imports: [
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './step1-check.html',
  encapsulation: ViewEncapsulation.None,
  styleUrl: './step1-check.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Step1Check implements OnInit {
  @Input() initialEmail = '';
  @Input() initialSchoolName = '';

  // Emits a partial state update back to Register
  @Output() stepComplete = new EventEmitter<Partial<RegistrationState>>();

  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly serverMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required,Validators.email]],
    schoolName: ['', [Validators.required, Validators.minLength(3)]],
  });

  get email() {return this.form.controls.email;}
  get schoolName() {return this.form.controls.schoolName;}

  ngOnInit(): void {
    // Pre-fill if navigating back from step 2
    if (this.initialEmail) this.form.patchValue({email: this.initialEmail});
    if (this.initialSchoolName) this.form.patchValue({schoolName: this.initialSchoolName});
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.serverMessage.set(null);

    this.auth.checkEmailAndSchool({
      email: this.form.getRawValue().email!,
      schoolName: this.form.getRawValue().schoolName!,
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);

        if (res.nextStep === 0) {
          this.serverMessage.set(res.message);
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 1800);
          return;
        }

        //nextStep 2 or 3 - emit to parent
        this.stepComplete.emit({
          step: res.nextStep as 2 | 3,
          email: this.form.getRawValue().email!,
          schoolName: this.form.getRawValue().schoolName!,
          schoolExists: res.schoolExists,
          schoolId: res.schoolId ?? null,
          serverMessage: res.message
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ?? 'Something went wrong. Please try again.',
        );
      }
    })
  }
}
