import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {CreateStudentRequest, StudentResponse, StudentStatus} from '../../models/student.models';
import {Gender} from '../../../../core/auth/models/auth.model';
import {StudentService} from '../../services/student.service';
import {AcademicService} from '../../../academics/services/academic.service';
import {ClassroomResponse} from '../../../academics/models/academic.model';
import {TokenService} from '../../../../core/auth/services/token.service';
import {Router} from '@angular/router';
import {ConfirmationService} from '../../../../shared/components/confirmation-modal/confirmation.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const pw  = control.get('password');
  const cpw = control.get('confirmPassword');
  if (!pw || !cpw) return null;
  return pw.value !== cpw.value ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-student-list',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './student-list.html',
  styleUrl: './student-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentList implements OnInit {
  private readonly service = inject(StudentService);
  private readonly academicService = inject(AcademicService);
  private readonly tokens  = inject(TokenService);
  private readonly fb      = inject(FormBuilder);
  private readonly router  = inject(Router);
  private readonly confirm = inject(ConfirmationService);

  // ─── State ────────────────────────────────────────────────────────────────
  readonly students      = signal<StudentResponse[]>([]);
  readonly classrooms    = signal<ClassroomResponse[]>([]);
  readonly selectedClass = signal<string | null>(null);
  readonly isLoading     = signal(true);
  readonly isSubmitting  = signal(false);
  readonly panelOpen     = signal(false);
  readonly searchQuery   = signal('');
  readonly statusFilter  = signal<StudentStatus | 'ALL'>('ALL');
  readonly errorMessage  = signal<string | null>(null);

  // Which student's status dropdown is open
  readonly statusMenuFor = signal<number | null>(null);

  // ─── Options ──────────────────────────────────────────────────────────────
  readonly genderOptions: { value: Gender; label: string }[] = [
    { value: 'MALE',   label: 'Male'   },
    { value: 'FEMALE', label: 'Female' },
  ];

  readonly statusOptions: { value: StudentStatus; label: string }[] = [
    { value: 'ACTIVE',      label: 'Active'      },
    { value: 'INACTIVE',    label: 'Inactive'    },
    { value: 'SUSPENDED',   label: 'Suspended'   },
    { value: 'GRADUATED',   label: 'Graduated'   },
    { value: 'TRANSFERRED', label: 'Transferred' },
    { value: 'EXPELLED',   label: 'Expelled'   },
  ];

  readonly bloodGroups = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];

  readonly form = this.fb.group(
    {
      firstName:   ['', [Validators.required, Validators.minLength(2)]],
      lastName:    ['', [Validators.required, Validators.minLength(2)]],
      email:       ['', [Validators.required, Validators.email]],
      password:    ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender:      ['' as Gender, Validators.required],
      address:     ['', Validators.required],
      admissionDate:    ['', Validators.required],
      currentClass:     ['', Validators.required],
      emergencyContactName:         [''],
      emergencyContactPhone:        [''],
      emergencyContactRelationship: [''],
      bloodGroup:                   [''],
      medicalConditions:            [''],
    },
    { validators: passwordMatchValidator }
  );

  get f() { return this.form.controls; }

  readonly filtered = computed<StudentResponse[]>(() => {
    let list = this.students();

    const status = this.statusFilter();
    if (status !== 'ALL') {
      list = list.filter(s => s.status === status);
    }

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(s =>
        s.firstName.toLowerCase().includes(q)       ||
        s.lastName.toLowerCase().includes(q)        ||
        s.email.toLowerCase().includes(q)           ||
        s.admissionNumber.toLowerCase().includes(q) ||
        s.currentClass.toLowerCase().includes(q)
      );
    }

    return list;
  });

  readonly totalActive = computed(() =>
    this.students().filter(s => s.status === 'ACTIVE').length
  );

  ngOnInit(): void {
    this.loadClassrooms();
  }

  loadClassrooms(): void {
    this.isLoading.set(true);
    this.academicService.getClassrooms(0, 100).subscribe({
      next: res => {
        this.classrooms.set(res.content);
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); },
    });
  }

  onClassSelect(className: string): void {
    this.selectedClass.set(className);
    this.loadStudents();
  }

  loadStudents(): void {
    const cls = this.selectedClass();
    if (!cls) return;
    this.isLoading.set(true);
    this.service.getByClass(cls).subscribe({
      next:  res => {
        const list = Array.isArray(res) ? res : (res as any)?.content ?? [];
        this.students.set(list);
        this.isLoading.set(false);
      },
      error: err => {
        console.error('Failed to load students for class:', cls, err);
        this.students.set([]);
        this.isLoading.set(false);
      },
    });
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

    const payload: CreateStudentRequest = {
      firstName:                    v.firstName!,
      lastName:                     v.lastName!,
      email:                        v.email!,
      password:                     v.password!,
      phoneNumber:                  v.phoneNumber!,
      dateOfBirth:                  v.dateOfBirth!,
      gender:                       v.gender!,
      address:                      v.address!,
      admissionDate:                v.admissionDate!,
      currentClass:                 v.currentClass!,
      emergencyContactName:         v.emergencyContactName || undefined,
      emergencyContactPhone:        v.emergencyContactPhone || undefined,
      emergencyContactRelationship: v.emergencyContactRelationship || undefined,
      bloodGroup:                   v.bloodGroup || undefined,
      medicalConditions:            v.medicalConditions || undefined,
    };

    this.service.create(payload).subscribe({
      next: () => {
        this.closePanel();
        this.isSubmitting.set(false);
        this.loadStudents();
      },
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to create student');
        this.isSubmitting.set(false);
      },
    });
  }

  changeStatus(student: StudentResponse, status: StudentStatus): void {
    this.statusMenuFor.set(null);
    this.service.updateStatus(student.id, status).subscribe({
      next: () => this.loadStudents(),
    });
  }

  async delete(student: StudentResponse): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Delete Student',
      message: `Remove ${student.firstName} ${student.lastName}? This cannot be undone.`,
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    this.service.delete(student.id).subscribe({
      next: () => this.loadStudents(),
    });
  }

  viewStudent(id: number): void {
    this.router.navigate(['/app/students', id]);
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.errorMessage.set(null);
    this.form.reset();
  }

  statusClass(status: StudentStatus): string {
    const map: Record<StudentStatus, string> = {
      ACTIVE:      'badge--active',
      INACTIVE:    'badge--inactive',
      SUSPENDED:   'badge--suspended',
      GRADUATED:   'badge--graduated',
      TRANSFERRED: 'badge--transferred',
      EXPELLED:   'badge--withdrawn',
    };
    return map[status];
  }

  statusLabel(status: StudentStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  fullName(s: StudentResponse): string {
    return `${s.firstName} ${s.lastName}`;
  }

  initials(s: StudentResponse): string {
    return `${s.firstName[0]}${s.lastName[0]}`.toUpperCase();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  readonly today = new Date().toISOString().split('T')[0];

  readonly isAdmin = computed(() => {
    const role = this.tokens.currentRole();
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  });
}
