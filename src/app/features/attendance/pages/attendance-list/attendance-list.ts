import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AttendanceService} from '../../services/attendance.service';
import {AcademicService} from '../../../academics/services/academic.service';
import {StudentService} from '../../../students/services/student.service';
import {TokenService} from '../../../../core/auth/services/token.service';
import {
  AttendanceResponse,
  AttendanceStatus,
  AttendanceSummaryResponse,
  STATUS_OPTIONS,
} from '../../models/attendance.models';
import {ClassroomResponse, SessionResponse, TermResponse} from '../../../academics/models/academic.model';
import {StudentResponse} from '../../../students/models/student.models';

@Component({
  selector: 'app-attendance-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-list.html',
  styleUrl: './attendance-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceList implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly academicService = inject(AcademicService);
  private readonly studentService = inject(StudentService);
  private readonly tokens = inject(TokenService);

  readonly classrooms = signal<ClassroomResponse[]>([]);
  readonly students = signal<(StudentResponse & { attendanceId?: number; attStatus?: AttendanceStatus; checkInTime?: string; remark?: string })[]>([]);
  readonly statusOptions = STATUS_OPTIONS;

  readonly selectedClassroomId = signal<number | null>(null);
  readonly selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly currentSession = signal<SessionResponse | null>(null);
  readonly currentTerm = signal<TermResponse | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly summary = signal<AttendanceSummaryResponse | null>(null);
  readonly showSummary = signal(false);
  readonly dirtyCount = signal(0);
  readonly successMessage = signal<string | null>(null);

  readonly selectedClassroom = computed(() =>
    this.classrooms().find(c => c.id === this.selectedClassroomId())
  );

  readonly attendanceMap = computed(() => {
    const map = new Map<number, { attStatus: AttendanceStatus; attendanceId?: number; checkInTime?: string; remark?: string }>();
    for (const s of this.students()) {
      if (s.attStatus) {
        map.set(s.id, { attStatus: s.attStatus, attendanceId: s.attendanceId, checkInTime: s.checkInTime, remark: s.remark });
      }
    }
    return map;
  });

  readonly stats = computed(() => {
    const records = this.students();
    const total = records.length;
    let present = 0, absent = 0, late = 0, excused = 0, halfDay = 0;
    for (const s of records) {
      switch (s.attStatus) {
        case 'PRESENT': present++; break;
        case 'ABSENT': absent++; break;
        case 'LATE': late++; break;
        case 'EXCUSED': excused++; break;
        case 'HALF_DAY': halfDay++; break;
      }
    }
    const marked = present + absent + late + excused + halfDay;
    return { total, present, absent, late, excused, halfDay, marked };
  });

  readonly allMarked = computed(() => this.stats().marked === this.stats().total && this.stats().total > 0);

  readonly isAdmin = computed(() => {
    const role = this.tokens.currentRole();
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  });

  readonly isTeacher = computed(() => {
    const role = this.tokens.currentRole();
    return role === 'TEACHER' || this.isAdmin();
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading.set(true);
    this.academicService.getClassrooms(0, 200).subscribe({
      next: res => {
        this.classrooms.set(res.content);
        this.loadCurrentSession();
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadCurrentSession(): void {
    this.academicService.getCurrentSession().subscribe({
      next: session => {
        this.currentSession.set(session);
        this.loadCurrentTerm();
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadCurrentTerm(): void {
    this.academicService.getCurrentTerm().subscribe({
      next: term => {
        this.currentTerm.set(term);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onClassroomSelect(classroomId: number): void {
    this.selectedClassroomId.set(classroomId);
    this.loadStudentsForClass();
  }

  onDateChange(date: string): void {
    this.selectedDate.set(date);
    if (this.selectedClassroomId()) {
      this.loadStudentsForClass();
    }
  }

  loadStudentsForClass(): void {
    const classroomId = this.selectedClassroomId();
    const date = this.selectedDate();
    if (!classroomId) return;

    const classroom = this.selectedClassroom();
    if (!classroom) return;

    this.isLoading.set(true);
    this.studentService.getByClass(classroom.name).subscribe({
      next: res => {
        const list = Array.isArray(res) ? res : (res as any)?.content ?? [];
        this.students.set(list.map((s: any) => ({
          ...s,
          attStatus: undefined,
          attendanceId: undefined,
          checkInTime: undefined,
          remark: undefined,
        })));
        this.loadExistingAttendance(classroomId, date);
        this.loadClassSummary();
      },
      error: () => {
        this.students.set([]);
        this.isLoading.set(false);
      },
    });
  }

  loadExistingAttendance(classroomId: number, date: string): void {
    this.attendanceService.getAttendanceByClassroom(classroomId, date, 0, 200).subscribe({
      next: res => {
        const existingMap = new Map<number, AttendanceResponse>();
        for (const record of res.content) {
          existingMap.set(record.studentId, record);
        }
        this.students.update(students =>
          students.map(s => {
            const existing = existingMap.get(s.id);
            if (existing) {
              return {
                ...s,
                attStatus: existing.status,
                attendanceId: existing.id,
                checkInTime: existing.checkInTime ?? undefined,
                remark: existing.remark ?? undefined,
              };
            }
            return s;
          })
        );
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadClassSummary(): void {
    const classroomId = this.selectedClassroomId();
    const termId = this.currentTerm()?.id;
    if (!classroomId || !termId) return;

    this.attendanceService.getClassroomSummary(classroomId, termId).subscribe({
      next: summary => {
        this.summary.set(summary);
        this.showSummary.set(true);
      },
    });
  }

  setStatus(studentId: number, status: AttendanceStatus): void {
    this.students.update(students =>
      students.map(s =>
        s.id === studentId ? { ...s, attStatus: status, checkInTime: status === 'PRESENT' || status === 'LATE' ? (s.checkInTime || new Date().toTimeString().slice(0, 8)) : undefined } : s
      )
    );
    this.updateDirtyCount();
  }

  markAllPresent(): void {
    this.students.update(students =>
      students.map(s => ({
        ...s,
        attStatus: 'PRESENT' as AttendanceStatus,
        checkInTime: s.checkInTime || new Date().toTimeString().slice(0, 8),
        remark: undefined,
      }))
    );
    this.updateDirtyCount();
  }

  markAll(status: AttendanceStatus): void {
    this.students.update(students =>
      students.map(s => ({
        ...s,
        attStatus: status,
        checkInTime: status === 'PRESENT' || status === 'LATE' ? (s.checkInTime || new Date().toTimeString().slice(0, 8)) : undefined,
        remark: undefined,
      }))
    );
    this.updateDirtyCount();
  }

  updateDirtyCount(): void {
    this.dirtyCount.set(this.students().filter(s => s.attStatus !== undefined).length);
  }

  saveAttendance(): void {
    const classroomId = this.selectedClassroomId();
    const sessionId = this.currentSession()?.id;
    const termId = this.currentTerm()?.id;
    const date = this.selectedDate();

    if (!classroomId || !sessionId || !termId) return;

    this.isSaving.set(true);
    this.successMessage.set(null);

    const records = this.students()
      .filter(s => s.attStatus !== undefined)
      .map(s => ({
        studentId: s.id,
        status: s.attStatus!,
        checkInTime: s.checkInTime,
        remark: s.remark,
      }));

    if (records.length === 0) {
      this.isSaving.set(false);
      return;
    }

    this.attendanceService.bulkMarkAttendance({
      classroomId,
      sessionId,
      termId,
      date,
      records,
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.successMessage.set(`Attendance saved for ${records.length} student${records.length !== 1 ? 's' : ''}`);
        this.loadExistingAttendance(classroomId, date);
        this.loadClassSummary();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: () => {
        this.isSaving.set(false);
      },
    });
  }

  statusClass(status: AttendanceStatus): string {
    const map: Record<AttendanceStatus, string> = {
      PRESENT: 'badge--present',
      ABSENT: 'badge--absent',
      LATE: 'badge--late',
      EXCUSED: 'badge--excused',
      HALF_DAY: 'badge--half-day',
    };
    return map[status];
  }

  statusLabel(status: AttendanceStatus): string {
    const map: Record<AttendanceStatus, string> = {
      PRESENT: 'Present',
      ABSENT: 'Absent',
      LATE: 'Late',
      EXCUSED: 'Excused',
      HALF_DAY: 'Half day',
    };
    return map[status];
  }

  statusIcon(status: AttendanceStatus): string {
    const icons: Record<AttendanceStatus, string> = {
      PRESENT: '✓',
      ABSENT: '✕',
      LATE: '⏰',
      EXCUSED: '📝',
      HALF_DAY: '½',
    };
    return icons[status];
  }

  fullName(s: StudentResponse): string {
    return `${s.firstName} ${s.lastName}`;
  }

  initials(s: StudentResponse): string {
    return `${s.firstName[0]}${s.lastName[0]}`.toUpperCase();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  readonly today = new Date().toISOString().split('T')[0];

  readonly markAllOptions = [
    { value: 'PRESENT' as AttendanceStatus, label: 'All Present' },
    { value: 'ABSENT' as AttendanceStatus, label: 'All Absent' },
    { value: 'LATE' as AttendanceStatus, label: 'All Late' },
    { value: 'EXCUSED' as AttendanceStatus, label: 'All Excused' },
  ];

  readonly showMarkAllMenu = signal(false);
}
