import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {GradeService} from '../../services/grade.service';
import {StudentService} from '../../../students/services/student.service';
import {ExamResponse, GradeResponse} from '../../models/grade.models';
import {StudentResponse} from '../../../students/models/student.models';

@Component({
  selector: 'app-grade-entry',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './grade-entry.html',
  styleUrl: './grade-entry.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeEntry implements OnInit {
  private readonly gradeService = inject(GradeService);
  private readonly studentService = inject(StudentService);
  private readonly route = inject(ActivatedRoute);

  readonly exam = signal<ExamResponse | null>(null);
  readonly students = signal<StudentEntry[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly examId = computed(() => Number(this.route.snapshot.paramMap.get('examId')));

  readonly stats = computed(() => {
    const entries = this.students();
    const graded = entries.filter(e => e.marksObtained !== null && e.marksObtained !== undefined);
    const total = entries.length;
    const avg = graded.length > 0
      ? graded.reduce((s, e) => s + (e.marksObtained ?? 0), 0) / graded.length
      : 0;
    return { total, graded: graded.length, average: avg.toFixed(1) };
  });

  ngOnInit(): void {
    this.loadExam();
  }

  private loadExam(): void {
    this.isLoading.set(true);
    this.gradeService.getExamById(this.examId()).subscribe({
      next: exam => {
        this.exam.set(exam);
        this.loadStudentsAndGrades(exam);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private loadStudentsAndGrades(exam: ExamResponse): void {
    this.studentService.getAll(0, 500).subscribe({
      next: res => {
        const studs = res.content.filter((s: StudentResponse) => {
          const studentClass = (s.currentClass ?? '').trim().toLowerCase();
          const examClass = (exam.classroomName ?? '').trim().toLowerCase();
          return studentClass === examClass || studentClass.startsWith(examClass);
        });
        this.gradeService.getGradesByExam(exam.id, 0, 500).subscribe({
          next: gradeRes => {
            const grades = gradeRes.content;
            const gradeMap = new Map<number, GradeResponse>();
            grades.forEach(g => gradeMap.set(g.studentId, g));

            const entries: StudentEntry[] = studs.map((s: StudentResponse) => {
              const existing = gradeMap.get(s.id);
              return {
                studentId: s.id,
                studentName: `${s.firstName} ${s.lastName}`,
                admissionNumber: s.admissionNumber,
                marksObtained: existing?.marksObtained ?? null,
                remark: existing?.remark ?? '',
                gradeId: existing?.id ?? null,
                letterGrade: existing?.letterGrade ?? '',
              };
            });

            this.students.set(entries);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false),
        });
      },
      error: () => this.isLoading.set(false),
    });
  }

  updateMarks(studentId: number, value: string): void {
    const num = value === '' ? null : parseFloat(value);
    this.students.update(entries =>
      entries.map(e => e.studentId === studentId ? { ...e, marksObtained: num } : e)
    );
  }

  updateRemark(studentId: number, value: string): void {
    this.students.update(entries =>
      entries.map(e => e.studentId === studentId ? { ...e, remark: value } : e)
    );
  }

  saveAll(): void {
    const exam = this.exam();
    if (!exam) return;

    const records = this.students()
      .filter(e => e.marksObtained !== null && e.marksObtained !== undefined)
      .map(e => ({
        studentId: e.studentId,
        marksObtained: e.marksObtained!,
        remark: e.remark || undefined,
      }));

    if (records.length === 0) {
      this.errorMessage.set('No grades to save');
      setTimeout(() => this.errorMessage.set(null), 3000);
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    this.gradeService.bulkAddGrades({ examId: exam.id, records }).subscribe({
      next: () => {
        this.successMessage.set(`${records.length} grades saved successfully`);
        this.isSaving.set(false);
        this.loadExam();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Failed to save grades');
        this.isSaving.set(false);
      },
    });
  }
}

interface StudentEntry {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  marksObtained: number | null;
  remark: string;
  gradeId: number | null;
  letterGrade: string;
}
