import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {GradeService} from '../../services/grade.service';
import {AcademicService} from '../../../academics/services/academic.service';
import {TokenService} from '../../../../core/auth/services/token.service';
import {ExamResponse, ExamType, EXAM_TYPE_OPTIONS} from '../../models/grade.models';
import {ClassroomResponse, SessionResponse, SubjectResponse, TermResponse} from '../../../academics/models/academic.model';

@Component({
  selector: 'app-exam-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './exam-list.html',
  styleUrl: './exam-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamList implements OnInit {
  private readonly gradeService = inject(GradeService);
  private readonly academicService = inject(AcademicService);
  private readonly tokens = inject(TokenService);

  readonly exams = signal<ExamResponse[]>([]);
  readonly classrooms = signal<ClassroomResponse[]>([]);
  readonly subjects = signal<SubjectResponse[]>([]);
  readonly terms = signal<TermResponse[]>([]);
  readonly currentSession = signal<SessionResponse | null>(null);
  readonly currentTerm = signal<TermResponse | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly examTypeOptions = EXAM_TYPE_OPTIONS;

  readonly selectedClassroomId = signal<number | null>(null);
  readonly selectedTermId = signal<number | null>(null);

  readonly showCreateForm = signal(false);
  readonly editingExam = signal<ExamResponse | null>(null);

  readonly formName = signal('');
  readonly formExamType = signal<ExamType>('MIDTERM');
  readonly formClassroomId = signal<number | null>(null);
  readonly formSubjectId = signal<number | null>(null);
  readonly formExamDate = signal('');
  readonly formMaxMarks = signal(100);
  readonly formWeightage = signal(0);
  readonly formDescription = signal('');

  readonly isAdmin = computed(() => this.tokens.currentRole() === 'ADMIN' || this.tokens.currentRole() === 'SUPER_ADMIN');
  readonly isTeacher = computed(() => this.tokens.currentRole() === 'TEACHER');

  readonly filteredExams = computed(() => {
    let list = this.exams();
    const classId = this.selectedClassroomId();
    const termId = this.selectedTermId();
    if (classId !== null) {
      list = list.filter(e => e.classroomId === classId);
    }
    if (termId !== null) {
      list = list.filter(e => e.termId === termId);
    }
    return list;
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.academicService.getClassrooms(0, 100).subscribe({
      next: res => this.classrooms.set(res.content),
    });
    this.academicService.getSubjects(0, 100).subscribe({
      next: res => this.subjects.set(res.content),
    });

    this.academicService.getSessions(0, 20).subscribe({
      next: res => {
        const sessions = res.content;
        const active = sessions.find(s => s.status === 'ACTIVE') ?? sessions[0];
        this.currentSession.set(active ?? null);
        if (active) {
          this.academicService.getTermsBySession(active.id).subscribe({
            next: (terms: any[]) => {
              this.terms.set(terms);
              const current = terms.find((t: any) => t.current) ?? terms[0];
              this.currentTerm.set(current ?? null);
              this.loadExams();
            },
          });
        } else {
          this.loadExams();
        }
      },
    });
  }

  private loadExams(): void {
    this.gradeService.getExams(0, 100).subscribe({
      next: res => {
        this.exams.set(res.content);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openCreate(): void {
    this.editingExam.set(null);
    this.formName.set('');
    this.formExamType.set('MIDTERM');
    this.formClassroomId.set(null);
    this.formSubjectId.set(null);
    this.formExamDate.set(new Date().toISOString().split('T')[0]);
    this.formMaxMarks.set(100);
    this.formWeightage.set(0);
    this.formDescription.set('');
    this.showCreateForm.set(true);
  }

  openEdit(exam: ExamResponse): void {
    this.editingExam.set(exam);
    this.formName.set(exam.name);
    this.formExamType.set(exam.examType);
    this.formClassroomId.set(exam.classroomId);
    this.formSubjectId.set(exam.subjectId);
    this.formExamDate.set(exam.examDate);
    this.formMaxMarks.set(exam.maxMarks);
    this.formWeightage.set(exam.weightage);
    this.formDescription.set(exam.description ?? '');
    this.showCreateForm.set(true);
  }

  closeForm(): void {
    this.showCreateForm.set(false);
    this.editingExam.set(null);
  }

  save(): void {
    if (!this.formName() || !this.formClassroomId() || !this.formSubjectId() || !this.formExamDate()) return;

    const payload = {
      name: this.formName(),
      examType: this.formExamType(),
      classroomId: this.formClassroomId()!,
      subjectId: this.formSubjectId()!,
      sessionId: this.currentSession()?.id ?? 0,
      termId: this.currentTerm()?.id ?? 0,
      examDate: this.formExamDate(),
      maxMarks: this.formMaxMarks(),
      weightage: this.formWeightage(),
      description: this.formDescription(),
    };

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const obs = this.editingExam()
      ? this.gradeService.updateExam(this.editingExam()!.id, payload)
      : this.gradeService.createExam(payload);

    obs.subscribe({
      next: () => {
        this.successMessage.set(this.editingExam() ? 'Exam updated' : 'Exam created');
        this.isSaving.set(false);
        this.closeForm();
        this.loadExams();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Failed to save exam');
        this.isSaving.set(false);
      },
    });
  }

  delete(exam: ExamResponse): void {
    if (!confirm(`Delete exam "${exam.name}"?`)) return;
    this.gradeService.deleteExam(exam.id).subscribe({
      next: () => {
        this.successMessage.set('Exam deleted');
        this.loadExams();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
    });
  }

  typeBadge(type: ExamType): string {
    const map: Record<string, string> = {
      QUIZ: 'badge--teal',
      ASSIGNMENT: 'badge--purple',
      MIDTERM: 'badge--amber',
      FINAL: 'badge--coral',
      PRACTICAL: 'badge--green',
      PROJECT: 'badge--slate',
    };
    return map[type] ?? 'badge--slate';
  }
}
