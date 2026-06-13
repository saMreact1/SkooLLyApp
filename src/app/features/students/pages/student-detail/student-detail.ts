import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {StudentResponse, StudentStatus, UpdateStudentRequest} from '../../models/student.models';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {TokenService} from '../../../../core/auth/services/token.service';
import {StudentService} from '../../services/student.service';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-student-detail',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './student-detail.html',
  styleUrl: './student-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentDetail {
  private readonly service = inject(StudentService);
  private readonly tokens  = inject(TokenService);
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly fb      = inject(FormBuilder);

  readonly student      = signal<StudentResponse | null>(null);
  readonly isLoading    = signal(true);
  readonly isSubmitting = signal(false);
  readonly editOpen     = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Edit form — only UpdateStudentRequest fields
  readonly form = this.fb.group({
    currentClass:                 [''],
    currentSection:               [''],
    emergencyContactName:         [''],
    emergencyContactPhone:        [''],
    emergencyContactRelationship: [''],
    bloodGroup:                   [''],
    medicalConditions:            [''],
  });

  readonly isAdmin = computed(() => {
    const r = this.tokens.currentRole();
    return r === 'ADMIN' || r === 'SUPER_ADMIN';
  });

  readonly statusOptions: { value: StudentStatus; label: string }[] = [
    { value: 'ACTIVE',      label: 'Active'      },
    { value: 'INACTIVE',    label: 'Inactive'    },
    { value: 'SUSPENDED',   label: 'Suspended'   },
    { value: 'GRADUATED',   label: 'Graduated'   },
    { value: 'TRANSFERRED', label: 'Transferred' },
    { value: 'EXPELLED',   label: 'expelled'   },
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next:  s  => { this.student.set(s); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.router.navigate(['/app/students']); },
    });
  }

  openEdit(): void {
    const s = this.student();
    if (!s) return;
    this.form.patchValue({
      currentClass:                 s.currentClass,
      currentSection:               s.currentSection,
      emergencyContactName:         s.emergencyContactName ?? '',
      emergencyContactPhone:        s.emergencyContactPhone ?? '',
      emergencyContactRelationship: s.emergencyContactRelationship ?? '',
      bloodGroup:                   s.bloodGroup ?? '',
      medicalConditions:            '',
    });
    this.errorMessage.set(null);
    this.editOpen.set(true);
  }

  submitEdit(): void {
    const s = this.student();
    if (!s) return;
    this.isSubmitting.set(true);
    const v = this.form.getRawValue();
    const payload: UpdateStudentRequest = {
      currentClass:                 v.currentClass   || undefined,
      currentSection:               v.currentSection || undefined,
      emergencyContactName:         v.emergencyContactName         || undefined,
      emergencyContactPhone:        v.emergencyContactPhone        || undefined,
      emergencyContactRelationship: v.emergencyContactRelationship || undefined,
      bloodGroup:                   v.bloodGroup                   || undefined,
      medicalConditions:            v.medicalConditions            || undefined,
    };
    this.service.update(s.id, payload).subscribe({
      next: updated => {
        this.student.set(updated);
        this.editOpen.set(false);
        this.isSubmitting.set(false);
      },
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Update failed');
        this.isSubmitting.set(false);
      },
    });
  }

  changeStatus(status: StudentStatus): void {
    const s = this.student();
    if (!s) return;
    this.service.updateStatus(s.id, status).subscribe({
      next: updated => this.student.set(updated),
    });
  }

  initials(s: StudentResponse): string {
    return `${s.firstName[0]}${s.lastName[0]}`.toUpperCase();
  }

  statusClass(status: StudentStatus): string {
    const map: Record<StudentStatus, string> = {
      ACTIVE: 'badge--active', INACTIVE: 'badge--inactive',
      SUSPENDED: 'badge--suspended', GRADUATED: 'badge--graduated',
      TRANSFERRED: 'badge--transferred', EXPELLED: 'badge--withdrawn',
    };
    return map[status];
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
}
