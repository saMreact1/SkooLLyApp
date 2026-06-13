import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {TeacherService} from '../../services/teacher.service';
import {TokenService} from '../../../../core/auth/services/token.service';
import {
  EmploymentType,
  QualificationLevel,
  TeacherResponse,
  TeacherStatus,
  UpdateTeacherRequest
} from '../../models/teacher.models';

@Component({
  selector: 'app-teacher-detail',
  imports: [
    RouterLink,
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './teacher-detail.html',
  styleUrl: './teacher-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherDetail implements OnInit {
  private readonly service = inject(TeacherService);
  private readonly tokens  = inject(TokenService);
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly fb      = inject(FormBuilder);

  readonly teacher      = signal  <TeacherResponse | null>(null);
  readonly isLoading    = signal(true);
  readonly isSubmitting = signal(false);
  readonly editOpen     = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    highestQualification: [null as QualificationLevel | null],
    specialization:       [''],
    yearsOfExperience:    [null as number | null],
    employmentType:       ['' as EmploymentType],
    designation:          [''],
  });

  readonly isAdmin = computed(() => {
    const r = this.tokens.currentRole();
    return r === 'ADMIN' || r === 'SUPER_ADMIN';
  });

  readonly statusOptions: { value: TeacherStatus; label: string }[] = [
    { value: 'ACTIVE',     label: 'Active'     },
    { value: 'INACTIVE',   label: 'Inactive'   },
    { value: 'SUSPENDED',  label: 'Suspended'  },
    { value: 'RESIGNED',   label: 'Resigned'   },
    { value: 'TERMINATED', label: 'Terminated' },
  ];

  readonly employmentTypes: { value: EmploymentType; label: string }[] = [
    { value: 'FULL_TIME', label: 'Full-time' },
    { value: 'PART_TIME', label: 'Part-time' },
    { value: 'CONTRACT',  label: 'Contract'  },
    { value: 'VOLUNTEER', label: 'Volunteer' },
  ];

  readonly qualifications: { value: QualificationLevel; label: string }[] = [
    { value: 'OND', label: 'OND' }, { value: 'HND', label: 'HND' },
    { value: 'BSC', label: 'B.Sc' }, { value: 'PGDE', label: 'PGDE' },
    { value: 'MSC', label: 'M.Sc' }, { value: 'PHD', label: 'Ph.D' },
    { value: 'OTHER', label: 'Other' },
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next:  t  => { this.teacher.set(t); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.router.navigate(['/app/teachers']); },
    });
  }

  openEdit(): void {
    const t = this.teacher();
    if (!t) return;
    this.form.patchValue({
      highestQualification: t.highestQualification ?? null,
      specialization:       t.specialization       ?? '',
      yearsOfExperience:    t.yearsOfExperience     ?? null,
      employmentType:       t.employmentType,
      designation:          t.designation           ?? '',
    });
    this.errorMessage.set(null);
    this.editOpen.set(true);
  }

  submitEdit(): void {
    const t = this.teacher();
    if (!t) return;
    this.isSubmitting.set(true);
    const v = this.form.getRawValue();
    const payload: UpdateTeacherRequest = {
      highestQualification: v.highestQualification || undefined,
      specialization:       v.specialization       || undefined,
      yearsOfExperience:    v.yearsOfExperience     ?? undefined,
      employmentType:       v.employmentType        || undefined,
      designation:          v.designation           || undefined,
    };
    this.service.update(t.id, payload).subscribe({
      next: updated => {
        this.teacher.set(updated);
        this.editOpen.set(false);
        this.isSubmitting.set(false);
      },
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Update failed');
        this.isSubmitting.set(false);
      },
    });
  }

  changeStatus(status: TeacherStatus): void {
    const t = this.teacher();
    if (!t) return;
    this.service.updateStatus(t.id, status).subscribe({
      next: updated => this.teacher.set(updated),
    });
  }

  initials(t: TeacherResponse): string {
    return `${t.firstName[0]}${t.lastName[0]}`.toUpperCase();
  }

  statusClass(status: TeacherStatus): string {
    const map: Record<TeacherStatus, string> = {
      ACTIVE: 'badge--active', INACTIVE: 'badge--inactive',
      SUSPENDED: 'badge--suspended', RESIGNED: 'badge--resigned',
      TERMINATED: 'badge--terminated',
    };
    return map[status];
  }

  qualificationLabel(q: QualificationLevel | null): string {
    if (!q) return '—';
    return this.qualifications.find(ql => ql.value === q)?.label ?? q;
  }

  employmentLabel(type: EmploymentType): string {
    return this.employmentTypes.find(e => e.value === type)?.label ?? type;
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }
}
