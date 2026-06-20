import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ReportCardResponse} from '../../models/grade.models';
import {GradeService} from '../../services/grade.service';
import {AcademicService} from '../../../academics/services/academic.service';
import {StudentService} from '../../../students/services/student.service';
import {TokenService} from '../../../../core/auth/services/token.service';
import {StudentResponse} from '../../../students/models/student.models';
import {ClassroomResponse, TermResponse} from '../../../academics/models/academic.model';

@Component({
  selector: 'app-report-card',
  imports: [CommonModule, FormsModule],
  templateUrl: './report-card.html',
  styleUrl: './report-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportCard implements OnInit {
  private readonly gradeService = inject(GradeService);
  private readonly academicService = inject(AcademicService);
  private readonly studentService = inject(StudentService);
  private readonly tokens = inject(TokenService);

  readonly classrooms = signal<ClassroomResponse[]>([]);
  readonly terms = signal<TermResponse[]>([]);
  readonly studentsInClass = signal<StudentResponse[]>([]);
  readonly selectedClassroomId = signal<number | null>(null);
  readonly selectedStudentId = signal<number | null>(null);
  readonly selectedTermId = signal<number | null>(null);
  readonly reportCard = signal<ReportCardResponse | null>(null);
  readonly showReport = signal(false);
  readonly isLoadingStudents = signal(false);
  readonly isLoadingReport = signal(false);

  readonly isStudent = computed(() => this.tokens.currentRole() === 'STUDENT');
  readonly hasReport = computed(() => this.reportCard() !== null);

  ngOnInit(): void {
    if (this.isStudent()) {
      this.studentService.getMyProfile().subscribe({
        next: profile => {
          this.selectedStudentId.set(profile.id);
        },
      });
      this.academicService.getCurrentSession().subscribe({
        next: session => {
          if (session) {
            this.academicService.getTermsBySession(session.id).subscribe({
              next: terms => this.terms.set(terms),
            });
          }
        },
      });
    } else {
      this.loadClassrooms();
    }
  }

  private loadClassrooms(): void {
    this.academicService.getClassrooms(0, 100).subscribe({
      next: res => this.classrooms.set(res.content),
    });
    this.academicService.getCurrentSession().subscribe({
      next: session => {
        if (session) {
          this.academicService.getTermsBySession(session.id).subscribe({
            next: terms => this.terms.set(terms),
          });
        }
      },
    });
  }

  onClassroomChange(classroomId: number): void {
    this.selectedClassroomId.set(classroomId);
    this.selectedStudentId.set(null);
    this.reportCard.set(null);
    this.showReport.set(false);
    const classroom = this.classrooms().find(c => c.id === classroomId);
    if (!classroom) return;

    this.isLoadingStudents.set(true);
    this.studentService.getAll(0, 500).subscribe({
      next: res => {
        const classroomName = (classroom.name ?? '').trim().toLowerCase();
        const filtered = res.content.filter((s: StudentResponse) => {
          const studentClass = (s.currentClass ?? '').trim().toLowerCase();
          return studentClass === classroomName || studentClass.startsWith(classroomName);
        });
        this.studentsInClass.set(filtered);
        this.isLoadingStudents.set(false);
      },
      error: () => this.isLoadingStudents.set(false),
    });
  }

  viewReport(studentId: number): void {
    this.selectedStudentId.set(studentId);
    const termId = this.selectedTermId();
    if (!termId) return;

    this.isLoadingReport.set(true);
    this.gradeService.getReportCard(studentId, termId).subscribe({
      next: report => {
        this.reportCard.set(report);
        this.showReport.set(true);
        this.isLoadingReport.set(false);
      },
      error: () => this.isLoadingReport.set(false),
    });
  }

  onTermChange(termId: number): void {
    this.selectedTermId.set(termId);
    if (this.isStudent()) {
      this.loadReport();
    }
  }

  loadReport(): void {
    const studentId = this.selectedStudentId();
    const termId = this.selectedTermId();
    if (!studentId || !termId) return;

    this.isLoadingReport.set(true);
    this.gradeService.getReportCard(studentId, termId).subscribe({
      next: report => {
        this.reportCard.set(report);
        this.showReport.set(true);
        this.isLoadingReport.set(false);
      },
      error: () => this.isLoadingReport.set(false),
    });
  }

  closeReport(): void {
    this.showReport.set(false);
    this.reportCard.set(null);
  }

  gradeClass(letter: string): string {
    if (!letter) return '';
    if (letter.startsWith('A')) return 'grade--a';
    if (letter.startsWith('B')) return 'grade--b';
    if (letter.startsWith('C')) return 'grade--c';
    if (letter === 'D') return 'grade--d';
    return 'grade--f';
  }
}
