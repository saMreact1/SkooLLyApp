import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AcademicService} from '../../services/academic.service';
import {StudentService} from '../../../students/services/student.service';
import {
  SubjectResponse,
  StudentSubjectResponse,
  TermResponse,
} from '../../models/academic.model';
import {StudentResponse} from '../../../students/models/student.models';
import {ConfirmationService} from '../../../../shared/components/confirmation-modal/confirmation.service';

@Component({
  selector: 'app-enrollment',
  imports: [CommonModule, FormsModule],
  templateUrl: './enrollment.html',
  styleUrls: ['./enrollment.css', '../../../../../styles/academics.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Enrollment implements OnInit {
  private readonly academicService = inject(AcademicService);
  private readonly studentService  = inject(StudentService);
  private readonly confirm         = inject(ConfirmationService);

  readonly students = signal<StudentResponse[]>([]);
  readonly subjects = signal<SubjectResponse[]>([]);
  readonly terms    = signal<TermResponse[]>([]);
  readonly enrolled = signal<StudentSubjectResponse[]>([]);

  readonly selectedStudentId = signal<number | null>(null);
  readonly selectedTermId    = signal<number | null>(null);
  readonly selectedSubjectIds = signal<Set<number>>(new Set());

  readonly isLoading       = signal(true);
  readonly isEnrolling     = signal(false);
  readonly isLoadingEnrolled = signal(false);
  readonly errorMessage    = signal<string | null>(null);
  readonly successMessage  = signal<string | null>(null);
  readonly searchQuery     = signal('');

  readonly selectedStudent = computed(() => {
    const id = this.selectedStudentId();
    return this.students().find(s => s.id === id) ?? null;
  });

  readonly selectedTerm = computed(() => {
    const id = this.selectedTermId();
    return this.terms().find(t => t.id === id) ?? null;
  });

  readonly filteredSubjects = computed(() => {
    const enrolledIds = new Set(this.enrolled().map(e => e.subjectId));
    let list = this.subjects().filter(s => s.active && !enrolledIds.has(s.id));
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.category ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  readonly enrolledSubjects = computed(() => this.enrolled());

  readonly selectedCount = computed(() => this.selectedSubjectIds().size);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.studentService.getAll(0, 200).subscribe({
      next: res => this.students.set(res.content),
    });

    this.academicService.getSubjects(0, 200).subscribe({
      next: res => this.subjects.set(res.content),
    });

    this.academicService.getCurrentSession().subscribe({
      next: session => {
        if (session.terms?.length) {
          this.terms.set(session.terms);
          const currentTerm = session.terms.find(t => t.status === 'ACTIVE');
          if (currentTerm) {
            this.selectedTermId.set(currentTerm.id);
          }
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onStudentChange(studentId: number): void {
    this.selectedStudentId.set(studentId);
    this.selectedSubjectIds.set(new Set());
    this.enrolled.set([]);
    this.loadEnrolled();
  }

  onTermChange(termId: number): void {
    this.selectedTermId.set(termId);
    this.loadEnrolled();
  }

  loadEnrolled(): void {
    const studentId = this.selectedStudentId();
    const termId = this.selectedTermId();
    if (!studentId || !termId) return;

    this.isLoadingEnrolled.set(true);
    this.academicService.getStudentSubjects(studentId, termId).subscribe({
      next: data => {
        this.enrolled.set(data);
        this.isLoadingEnrolled.set(false);
      },
      error: () => this.isLoadingEnrolled.set(false),
    });
  }

  toggleSubject(subjectId: number): void {
    const current = new Set(this.selectedSubjectIds());
    if (current.has(subjectId)) {
      current.delete(subjectId);
    } else {
      current.add(subjectId);
    }
    this.selectedSubjectIds.set(current);
  }

  isSubjectSelected(subjectId: number): boolean {
    return this.selectedSubjectIds().has(subjectId);
  }

  async enroll(): Promise<void> {
    const studentId = this.selectedStudentId();
    const termId = this.selectedTermId();
    const subjectIds = Array.from(this.selectedSubjectIds());

    if (!studentId || !termId || subjectIds.length === 0) return;

    const confirmed = await this.confirm.confirm({
      title: 'Enroll Student',
      message: `Enroll in ${subjectIds.length} subject(s)?`,
      confirmText: 'Enroll',
    });
    if (!confirmed) return;

    this.isEnrolling.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.academicService.enrollStudent({ studentId, subjectIds, termId }).subscribe({
      next: () => {
        this.successMessage.set(`Successfully enrolled in ${subjectIds.length} subject(s)`);
        this.selectedSubjectIds.set(new Set());
        this.loadEnrolled();
        this.isEnrolling.set(false);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Enrollment failed');
        this.isEnrolling.set(false);
      },
    });
  }

  async dropEnrollment(enrollment: StudentSubjectResponse): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Drop Subject',
      message: `Remove "${enrollment.subjectName}" from this student's enrollment?`,
      confirmText: 'Drop',
    });
    if (!confirmed) return;

    const termId = this.selectedTermId();
    if (!termId) return;

    this.academicService.dropStudentFromSubject(
      enrollment.studentId, enrollment.subjectId, termId
    ).subscribe({
      next: () => {
        this.loadEnrolled();
      },
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to drop subject');
      },
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      ENROLLED: 'Enrolled',
      DROPPED: 'Dropped',
      COMPLETED: 'Completed',
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      ENROLLED: 'badge--active',
      DROPPED: 'badge--inactive',
      COMPLETED: 'badge--graduated',
    };
    return map[status] ?? '';
  }
}
