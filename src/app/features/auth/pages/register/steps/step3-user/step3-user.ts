import {
  ChangeDetectionStrategy,
  Component, computed, DestroyRef,
  EventEmitter,
  inject,
  Input,
  NgZone, OnInit,
  Output,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import {EmploymentType, Gender, UserRole} from '../../../../../../core/auth/models/auth.model';
import {AuthService} from '../../../../../../core/auth/services/auth.service';
import {CommonModule} from '@angular/common';
import {of, startWith} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';

// Custom validator: password confirmation must match password
function passwordMatchValidator(
  group: AbstractControl
): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'app-step3-user',
  imports: [
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './step3-user.html',
  encapsulation: ViewEncapsulation.None,
  styleUrl: './step3-user.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Step3User implements OnInit {
  @Input({ required: true }) email!: string;
  @Input({ required: true }) schoolId!: number;
  @Input({ required: true }) schoolName!: string;

  @Output() stepComplete = new EventEmitter<void>();
  @Output() back         = new EventEmitter<void>();

  private readonly auth = inject(AuthService);
  private readonly fb   = inject(FormBuilder);

  readonly isLoading    = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly classrooms  = signal<string[]>([]);

  readonly avatarPreview = signal<string | null>(null);
  private selectedAvatar: File | null = null;
  private uploadedAvatar: string | null = null;

  readonly today      = new Date().toISOString().split('T')[0];

  readonly genderOptions: { value: Gender; label: string }[] = [
    { value: 'MALE',   label: 'Male'   },
    { value: 'FEMALE', label: 'Female' },
  ];

  readonly roleOptions: { value: UserRole; label: string }[] = [
    { value: 'ADMIN',   label: 'Administrator' },
    { value: 'TEACHER', label: 'Teacher'        },
    { value: 'STUDENT', label: 'Student'        },
    { value: 'PARENT',  label: 'Parent / Guardian' },
  ];

  readonly employmentTypeOptions: { value: EmploymentType; label: string }[] = [
    { value: 'FULL_TIME', label: 'Full-time' },
    { value: 'PART_TIME', label: 'Part-time' },
    { value: 'CONTRACT',  label: 'Contract'  },
    { value: 'VOLUNTEER', label: 'Volunteer' },
  ];

  readonly bloodGroups = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];

  readonly form = this.fb.group(
    {
      firstName:   ['', [Validators.required, Validators.minLength(2)]],
      lastName:    ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender:      ['' as Gender,   Validators.required],
      role:        ['' as UserRole, Validators.required],
      address:     ['', Validators.required],
      password:    ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],

      // Teacher-only
      teacherEmploymentType: ['' as EmploymentType],

      // Student-only fields (conditionally required)
      currentClass:                 [''],
      admissionDate:                [''],
      emergencyContactName:         [''],
      emergencyContactPhone:        [''],
      emergencyContactRelationship: [''],
      bloodGroup:                   [''],
      medicalConditions:            [''],
    },
    { validators: passwordMatchValidator }
  );

  get f() { return this.form.controls; }

  readonly roleValue = toSignal(
    this.form.controls.role.valueChanges.pipe(
      startWith(this.form.controls.role.value)
    )
  );

  readonly isTeacherRole = computed(() => this.f.role.value === 'TEACHER');

  readonly isStudentRole = computed(
    () => this.roleValue() === 'STUDENT'
  );

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.toggleStudentValidators(
      this.form.controls.role.value === 'STUDENT'
    );

    this.form.controls.role.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(role => {
        this.toggleStudentValidators(role === 'STUDENT');
      });

    this.auth.getSchoolClassrooms(this.schoolId).subscribe({
      next: list => this.classrooms.set(list),
      error: () => {},
    });
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.processAvatarFile(file);
  }

  private processAvatarFile(file: File): void {
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage.set('Profile picture must be under 10MB');
      return;
    }
    this.selectedAvatar = file;
    this.uploadedAvatar = null;
    this.avatarPreview.set(URL.createObjectURL(file));
  }

  removeAvatar(): void {
    this.avatarPreview.set(null);
    this.selectedAvatar = null;
    this.uploadedAvatar = null;
  }

  private toggleStudentValidators(isStudent: boolean): void {
    const studentRequiredFields = ['currentClass', 'admissionDate'] as const;

    for (const fieldName of studentRequiredFields) {
      const control = this.form.controls[fieldName];
      if (isStudent) {
        control.addValidators(Validators.required);
      } else {
        control.removeValidators(Validators.required);
        control.reset('');
      }
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const v           = this.form.getRawValue();
    const isStudent   = v.role === 'STUDENT';
    const isTeacher = v.role === 'TEACHER';

    const upload$ = this.selectedAvatar ? this.auth.uploadFile(this.selectedAvatar, 'avatars')
      : of({url: ''});

    upload$
      .pipe(
        switchMap(uploadResult =>
          this.auth.register({
            schoolId: this.schoolId,
            email: this.email,
            firstName: v.firstName!,
            lastName: v.lastName!,
            phoneNumber: v.phoneNumber!,
            dateOfBirth: v.dateOfBirth!,
            gender: v.gender!,
            role: v.role!,
            address: v.address!,
            password: v.password!,
            profilePictureUrl: uploadResult?.url || undefined,

            teacherEmploymentType: isTeacher && v.teacherEmploymentType
              ? v.teacherEmploymentType
              : undefined,

            admissionDate: isStudent ? v.admissionDate! : undefined,
            currentClass: isStudent ? v.currentClass! : undefined,
            emergencyContactName: isStudent ? v.emergencyContactName || undefined : undefined,
            emergencyContactPhone: isStudent ? v.emergencyContactPhone || undefined : undefined,
            emergencyContactRelationship: isStudent ? v.emergencyContactRelationship || undefined : undefined,
            bloodGroup: isStudent ? v.bloodGroup || undefined : undefined,
            medicalConditions: isStudent ? v.medicalConditions || undefined : undefined,
          })
        )
      )
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.stepComplete.emit();
          this.auth.redirectToDashboard();
        },
        error: err => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err?.error?.message ?? 'Registration failed. Please try again.'
          );
        }
      });
  }
}
