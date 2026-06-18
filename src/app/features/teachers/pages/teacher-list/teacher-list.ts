import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {TeacherService} from '../../services/teacher.service';
import {TokenService} from '../../../../core/auth/services/token.service';
import {Router} from '@angular/router';
import {
  CreateTeacherRequest,
  EmploymentType,
  QualificationLevel,
  TeacherResponse,
  TeacherStatus
} from '../../models/teacher.models';
import {Gender} from '../../../../core/auth/models/auth.model';
import {ConfirmationService} from '../../../../shared/components/confirmation-modal/confirmation.service';
import {Paginator} from '../../../../shared/components/paginator';
import {PagedResponse} from '../../../../shared/models/paged-response.model';

@Component({
  selector: 'app-teacher-list',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    Paginator,
  ],
  templateUrl: './teacher-list.html',
  styleUrl: './teacher-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeacherList implements OnInit {
  private readonly service = inject(TeacherService);
  private readonly tokens  = inject(TokenService);
  private readonly fb      = inject(FormBuilder);
  private readonly router  = inject(Router);
  private readonly confirm = inject(ConfirmationService);

  readonly pagedResponse = signal<PagedResponse<TeacherResponse> | null>(null);
  readonly currentPage   = signal(0);
  readonly pageSize      = signal(20);

  readonly teachers  = computed(() => this.pagedResponse()?.content ?? []);
  readonly isLoading  = signal(true);
  readonly isSubmitting = signal(false);
  readonly panelOpen    = signal(false);
  readonly searchQuery  = signal('');
  readonly statusFilter = signal<TeacherStatus | 'ALL'>('ALL');
  readonly errorMessage = signal<string | null>(null);
  readonly statusMenuFor = signal<number | null>(null);

  readonly genderOptions: { value: Gender; label: string }[] = [
    { value: 'MALE',   label: 'Male'   },
    { value: 'FEMALE', label: 'Female' },
  ];

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
    { value: 'OND',   label: 'OND'  },
    { value: 'HND',   label: 'HND'  },
    { value: 'BSC',   label: 'B.Sc' },
    { value: 'PGDE',  label: 'PGDE' },
    { value: 'MSC',   label: 'M.Sc' },
    { value: 'PHD',   label: 'Ph.D' },
    { value: 'OTHER', label: 'Other'},
  ];

  readonly today = new Date().toISOString().split('T')[0];

  readonly form = this.fb.group({
    firstName:   ['', [Validators.required, Validators.minLength(2)]],
    lastName:    ['', [Validators.required, Validators.minLength(2)]],
    email:       ['', [Validators.required, Validators.email]],
    password:    ['', [Validators.required, Validators.minLength(8)]],
    phoneNumber: ['', Validators.required],
    dateOfBirth: ['', Validators.required],
    gender:      ['' as Gender, Validators.required],
    address:     ['', Validators.required],
    // Teacher profile fields
    joinDate:              ['', Validators.required],
    employmentType:        ['' as EmploymentType, Validators.required],
    highestQualification:  ['' as QualificationLevel],
    specialization:        [''],
    yearsOfExperience:     [null as number | null],
    designation:           [''],
  });

  get f() { return this.form.controls; }

  readonly filtered = computed<TeacherResponse[]>(() => {
    let list = this.teachers();

    const status = this.statusFilter();
    if (status !== 'ALL') {
      list = list.filter(t => t.status === status);
    }

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(t =>
        t.firstName.toLowerCase().includes(q)  ||
        t.lastName.toLowerCase().includes(q)   ||
        t.email.toLowerCase().includes(q)      ||
        t.staffId.toLowerCase().includes(q)    ||
        (t.specialization ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  readonly totalActive = computed(() =>
    this.teachers().filter(t => t.status === 'ACTIVE').length
  );

  readonly isAdmin = computed(() => {
    const r = this.tokens.currentRole();
    return r === 'ADMIN' || r === 'SUPER_ADMIN';
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    this.service.getAll(this.currentPage(), this.pageSize()).subscribe({
      next:  res => { this.pagedResponse.set(res); this.isLoading.set(false); },
      error: ()  => { this.isLoading.set(false); },
    });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  openCreate(): void {
    this.form.reset();
    this.errorMessage.set(null);
    this.panelOpen.set(true);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting.set(true);
    const v = this.form.getRawValue();

    const payload: CreateTeacherRequest = {
      firstName:            v.firstName!,
      lastName:             v.lastName!,
      email:                v.email!,
      password:             v.password!,
      phoneNumber:          v.phoneNumber!,
      dateOfBirth:          v.dateOfBirth!,
      gender:               v.gender!,
      address:              v.address!,
      joinDate:             v.joinDate!,
      employmentType:       v.employmentType!,
      highestQualification: v.highestQualification || undefined,
      specialization:       v.specialization       || undefined,
      yearsOfExperience:    v.yearsOfExperience     ?? undefined,
      designation:          v.designation           || undefined,
    };

    this.service.create(payload).subscribe({
      next: () => {
        this.load();
        this.closePanel();
        this.isSubmitting.set(false);
      },
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to create teacher');
        this.isSubmitting.set(false);
      },
    });
  }

  changeStatus(teacher: TeacherResponse, status: TeacherStatus): void {
    this.statusMenuFor.set(null);
    this.service.updateStatus(teacher.id, status).subscribe({
      next: () => this.load(),
    });
  }

  async delete(teacher: TeacherResponse): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Delete Teacher',
      message: `Remove ${teacher.firstName} ${teacher.lastName}?`,
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    this.service.delete(teacher.id).subscribe({
      next: () => this.load(),
    });
  }

  viewTeacher(id: number): void {
    this.router.navigate(['/app/teachers', id]);
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.errorMessage.set(null);
    this.form.reset();
  }

  initials(t: TeacherResponse): string {
    return `${t.firstName[0]}${t.lastName[0]}`.toUpperCase();
  }

  fullName(t: TeacherResponse): string {
    return `${t.firstName} ${t.lastName}`;
  }

  statusClass(status: TeacherStatus): string {
    const map: Record<TeacherStatus, string> = {
      ACTIVE:     'badge--active',
      INACTIVE:   'badge--inactive',
      SUSPENDED:  'badge--suspended',
      RESIGNED:   'badge--resigned',
      TERMINATED: 'badge--terminated',
    };
    return map[status];
  }

  employmentLabel(type: EmploymentType): string {
    return this.employmentTypes.find(e => e.value === type)?.label ?? type;
  }

  qualificationLabel(q: QualificationLevel | null): string {
    if (!q) return '—';
    return this.qualifications.find(ql => ql.value === q)?.label ?? q;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }
}
