import {ChangeDetectionStrategy, Component, inject, OnInit, signal, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {AuthService} from '../../../../core/auth/services/auth.service';
import {TokenService} from '../../../../core/auth/services/token.service';
import {StudentService} from '../../../students/services/student.service';
import {TeacherService} from '../../../teachers/services/teacher.service';
import {AcademicService} from '../../../academics/services/academic.service';
import {CommunicationService} from '../../../communications/services/communication.service';
import {StudentResponse} from '../../../students/models/student.models';
import {TeacherResponse} from '../../../teachers/models/teacher.models';
import {SessionResponse, TermResponse, SubjectResponse, TimetableResponse, DayOfWeek, ClassroomResponse} from '../../../academics/models/academic.model';
import {Announcement} from '../../../communications/models/communication.models';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Admin implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly tokens = inject(TokenService);
  private readonly studentService = inject(StudentService);
  private readonly teacherService = inject(TeacherService);
  private readonly academicService = inject(AcademicService);
  private readonly communicationService = inject(CommunicationService);

  readonly currentUser = this.auth.currentUser;
  readonly isLoading = signal(true);
  readonly role = this.tokens.currentRole;

  readonly isAdmin = computed(() => {
    const r = this.role();
    return r === 'ADMIN' || r === 'SUPER_ADMIN';
  });
  readonly isTeacher = computed(() => this.role() === 'TEACHER');
  readonly isStudent = computed(() => this.role() === 'STUDENT');

  // Stats
  readonly totalStudents = signal(0);
  readonly totalTeachers = signal(0);
  readonly totalClassrooms = signal(0);
  readonly totalSubjects = signal(0);

  // Lists
  readonly recentStudents = signal<StudentResponse[]>([]);
  readonly recentTeachers = signal<TeacherResponse[]>([]);
  readonly subjects = signal<SubjectResponse[]>([]);
  readonly announcements = signal<Announcement[]>([]);

  // Session/term
  readonly currentSession = signal<SessionResponse | null>(null);
  readonly currentTerm = signal<TermResponse | null>(null);

  // Today's timetable (student / teacher)
  readonly todayTimetable = signal<TimetableResponse[]>([]);
  readonly todayDayOfWeek = computed<DayOfWeek | string>(() => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[new Date().getDay()];
  });

  // Greeting
  readonly greeting = signal('');

  ngOnInit(): void {
    this.setGreeting();
    this.loadDashboardData();
  }

  private setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting.set('Good morning');
    else if (hour < 17) this.greeting.set('Good afternoon');
    else this.greeting.set('Good evening');
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);

    const emptyPaged = { content: [], totalElements: 0, totalPages: 0, size: 0, page: 0, first: true, last: true };

    if (this.isAdmin()) {
      forkJoin({
        studentCount: this.studentService.getCount().pipe(catchError(() => of(0))),
        teacherCount: this.teacherService.getCount().pipe(catchError(() => of(0))),
        classroomCount: this.academicService.getClassroomCount().pipe(catchError(() => of(0))),
        subjectPage: this.academicService.getSubjects(0, 100).pipe(catchError(() => of(emptyPaged as any))),
        recentStudents: this.studentService.getAll(0, 5).pipe(catchError(() => of(emptyPaged as any))),
        recentTeachers: this.teacherService.getAll(0, 5).pipe(catchError(() => of(emptyPaged as any))),
        subjectList: this.academicService.getSubjects(0, 6).pipe(catchError(() => of(emptyPaged as any))),
        announcements: this.communicationService.getAllAnnouncements(0, 5).pipe(catchError(() => of(emptyPaged as any))),
        currentSession: this.academicService.getCurrentSession().pipe(catchError(() => of(null))),
        currentTerm: this.academicService.getCurrentTerm().pipe(catchError(() => of(null))),
      }).subscribe({
        next: (d) => {
          this.totalStudents.set(d.studentCount);
          this.totalTeachers.set(d.teacherCount);
          this.totalClassrooms.set(d.classroomCount);
          this.totalSubjects.set(d.subjectPage.totalElements);
          this.recentStudents.set(d.recentStudents.content);
          this.recentTeachers.set(d.recentTeachers.content);
          this.subjects.set(d.subjectList.content);
          this.announcements.set(d.announcements.content);
          this.currentSession.set(d.currentSession);
          this.currentTerm.set(d.currentTerm);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    } else if (this.isTeacher()) {
      forkJoin({
        classroomCount: this.academicService.getClassroomCount().pipe(catchError(() => of(0))),
        subjectList: this.academicService.getSubjects(0, 100).pipe(catchError(() => of(emptyPaged as any))),
        announcements: this.communicationService.getVisibleAnnouncements('TEACHERS', 0, 5).pipe(catchError(() => of(emptyPaged as any))),
        currentSession: this.academicService.getCurrentSession().pipe(catchError(() => of(null))),
        currentTerm: this.academicService.getCurrentTerm().pipe(catchError(() => of(null))),
      }).subscribe({
        next: (d) => {
          this.totalClassrooms.set(d.classroomCount);
          this.subjects.set(d.subjectList.content);
          this.announcements.set(d.announcements.content);
          this.currentSession.set(d.currentSession);
          this.currentTerm.set(d.currentTerm);
          this.isLoading.set(false);
          if (d.currentTerm) {
            this.loadTeacherTimetable(d.currentTerm.id);
          }
        },
        error: () => this.isLoading.set(false),
      });
    } else {
      // Student / Parent
      forkJoin({
        announcements: this.communicationService.getVisibleAnnouncements('STUDENTS', 0, 5).pipe(catchError(() => of(emptyPaged as any))),
        currentSession: this.academicService.getCurrentSession().pipe(catchError(() => of(null))),
        currentTerm: this.academicService.getCurrentTerm().pipe(catchError(() => of(null))),
      }).subscribe({
        next: (d) => {
          this.announcements.set(d.announcements.content);
          this.currentSession.set(d.currentSession);
          this.currentTerm.set(d.currentTerm);
          this.isLoading.set(false);
          if (d.currentTerm && this.isStudent()) {
            this.loadStudentTimetable(d.currentTerm.id);
          }
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  private loadStudentTimetable(termId: number): void {
    this.studentService.getMyProfile().pipe(
      catchError(() => of(null)),
    ).subscribe({
      next: student => {
        if (!student?.currentClass) return;
        const emptyPaged = { content: [], totalElements: 0, totalPages: 0, size: 0, page: 0, first: true, last: true };

        // Load enrolled subjects and timetable in parallel
        this.academicService.getMyEnrolledSubjects(termId).pipe(
          catchError(() => of([])),
        ).subscribe({
          next: enrolled => {
            const enrolledIds = new Set(enrolled.map(e => e.subjectId));
            this.academicService.getClassrooms(0, 100).pipe(
              catchError(() => of(emptyPaged as any)),
            ).subscribe({
              next: res => {
                const match = res.content.find(
                  (c: ClassroomResponse) => c.name === student.currentClass
                );
                if (!match) return;
                this.academicService.getTimetableByClassroom(match.id, termId).pipe(
                  catchError(() => of([] as TimetableResponse[])),
                ).subscribe({
                  next: slots => {
                    const today = this.todayDayOfWeek();
                    this.todayTimetable.set(
                      slots
                        .filter(s => s.dayOfWeek === today && enrolledIds.has(s.subjectId))
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    );
                  },
                });
              },
            });
          },
        });
      },
    });
  }

  private loadTeacherTimetable(termId: number): void {
    this.teacherService.getMyProfile().pipe(
      catchError(() => of(null)),
    ).subscribe({
      next: teacher => {
        if (!teacher) return;
        this.academicService.getTimetableByTeacher(teacher.id, termId).pipe(
          catchError(() => of([] as TimetableResponse[])),
        ).subscribe({
          next: slots => {
            const today = this.todayDayOfWeek();
            this.todayTimetable.set(
              slots
                .filter(s => s.dayOfWeek === today)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
            );
          },
        });
      },
    });
  }

  fullName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`;
  }

  initials(firstName: string, lastName: string): string {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  timeAgo(iso: string): string {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return this.formatDate(iso);
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'badge--active',
      INACTIVE: 'badge--inactive',
      SUSPENDED: 'badge--suspended',
    };
    return map[status] ?? 'badge--inactive';
  }

  statusLabel(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  priorityClass(priority: string): string {
    const map: Record<string, string> = {
      URGENT: 'priority--urgent',
      HIGH: 'priority--high',
      NORMAL: 'priority--normal',
      LOW: 'priority--low',
    };
    return map[priority] ?? 'priority--normal';
  }

  truncate(text: string, max: number): string {
    return text.length > max ? text.substring(0, max) + '...' : text;
  }

  formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  }

  formatDayOfWeek(day: DayOfWeek | string): string {
    return day.charAt(0) + day.slice(1).toLowerCase();
  }
}
