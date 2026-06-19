import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {
  ClassroomResponse,
  DayOfWeek,
  SessionResponse,
  SubjectResponse, TermResponse, TimetableResponse,
} from '../../models/academic.model';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AcademicService} from '../../services/academic.service';
import {TokenService} from '../../../../core/auth/services/token.service';
import {StudentService} from '../../../students/services/student.service';
import {TeacherService} from '../../../teachers/services/teacher.service';
import {TeacherResponse} from '../../../teachers/models/teacher.models';
import {ConfirmationService} from '../../../../shared/components/confirmation-modal/confirmation.service';
import {catchError, of, switchMap} from 'rxjs';

const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00',
];

const DAYS: DayOfWeek[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'
];

const SLOT_COLOURS = [
  'slot--teal', 'slot--purple', 'slot--amber',
  'slot--blue',  'slot--coral', 'slot--green',
];

@Component({
  selector: 'app-timetable',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './timetable.html',
  styleUrls: ['./timetable.css', '../../../../../styles/academics.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Timetable implements OnInit {
  private readonly academic = inject(AcademicService);
  private readonly teacherSrv   = inject(TeacherService);
  private readonly token    = inject(TokenService);
  private readonly studentSrv = inject(StudentService);
  private readonly fb       = inject(FormBuilder);
  private readonly confirm  = inject(ConfirmationService);

  readonly timeSlots = TIME_SLOTS;
  readonly days      = DAYS;

  readonly sessions = signal<SessionResponse[]>([]);
  readonly terms = signal<TermResponse[]>([]);
  readonly classrooms = signal<ClassroomResponse[]>([]);
  readonly subjects = signal<SubjectResponse[]>([]);
  readonly teachers = signal<TeacherResponse[]>([]);
  readonly slots              = signal<TimetableResponse[]>([]);
  readonly enrolledSubjectIds = signal<Set<number>>(new Set());
  readonly selectedClassroomId = signal<number | null>(null);
  readonly selectedSessionId = signal<number | null>(null);
  readonly selectedTermId = signal<number | null>(null);
  readonly isLoadingSessions     = signal(true);
  readonly isLoadingTerms  = signal<boolean>(false);
  readonly isLoadingSlots     = signal(false);
  readonly isSubmitting       = signal(false);
  readonly panelOpen          = signal(false);
  readonly errorMessage       = signal<string | null>(null);

  readonly isStudent = computed(() => this.token.currentRole() === 'STUDENT');

  readonly form = this.fb.group({
    subjectId:  [null as number | null, Validators.required],
    teacherId:  [null as number | null, Validators.required],
    dayOfWeek:  ['' as DayOfWeek,       Validators.required],
    startTime:  ['',                     Validators.required],
    endTime:    ['',                     Validators.required],
  });

  // Pre-filled when user clicks a cell to add a slot for that day+time
  readonly prefillDay  = signal<DayOfWeek | null>(null);
  readonly prefillTime = signal<string | null>(null);
  readonly editingSlot = signal<TimetableResponse | null>(null);
  readonly selectedSubjectIds = signal<Set<number>>(new Set());
  readonly subjectSearch = signal('');

  private readonly colorMap = new Map<number, string>();

  // ─── Derived: 2D grid lookup map[day][time] → slot[] ─────────────────
  readonly gridMap = computed(() => {
    const map = new Map<string, TimetableResponse[]>();
    const enrolledIds = this.enrolledSubjectIds();
    const isStudent = this.isStudent();

    for (const slot of this.slots()) {
      // Students only see enrolled subjects
      if (isStudent && !enrolledIds.has(slot.subjectId)) {
        continue;
      }
      const timeKey = slot.startTime.slice(0, 5);
      const key = `${slot.dayOfWeek}__${timeKey}`;
      const existing = map.get(key) ?? [];
      existing.push(slot);
      map.set(key, existing);
    }
    return map;
  });

  readonly selectedSession = computed<SessionResponse | null>(() =>
    this.sessions().find(s => s.id === this.selectedSessionId()) ?? null
  );

  readonly selectedTerm = computed<TermResponse | null>(() =>
    this.terms().find(t => t.id === this.selectedTermId()) ?? null
  );

  readonly selectedClassroom = computed<ClassroomResponse | null>(() =>
    this.classrooms().find(c => c.id === this.selectedClassroomId()) ?? null
  );

  ngOnInit(): void {
    this.academic.getSessions(0, 100).subscribe({
      next: res => {
        this.sessions.set(res.content);
        this.isLoadingSessions.set(false);
        // Auto-select current session
        const current = res.content.find(s => s.isCurrent);
        if (current) this.selectSession(current.id);
      },
      error: () => this.isLoadingSessions.set(false),
    });

    this.academic.getSubjects(0, 100).subscribe({
      next: res => {
        this.subjects.set(res.content);
        res.content.forEach((s, i) => {
          this.colorMap.set(s.id, SLOT_COLOURS[i % SLOT_COLOURS.length]);
        });
      },
    });

    this.teacherSrv.getAll(0, 200).subscribe({
      next: res => this.teachers.set(res.content),
    });
  }

  selectSession(id: number): void {
    this.selectedSessionId.set(id);
    this.selectedTermId.set(null);
    this.selectedClassroomId.set(null);
    this.terms.set([]);
    this.slots.set([]);
    this.isLoadingTerms.set(true);

    this.academic.getTermsBySession(id).subscribe({
      next: terms => {
        this.terms.set(terms);
        this.isLoadingTerms.set(false);
        // Auto-select current term
        const current = terms.find(t => t.isCurrent);
        if (current) this.selectTerm(current.id);
      },
      error: () => this.isLoadingTerms.set(false),
    });
  }

  selectTerm(id: number): void {
    this.selectedTermId.set(id);
    this.selectedClassroomId.set(null);
    this.slots.set([]);

    // Load classrooms (school-scoped, not term-scoped)
    if (this.classrooms().length === 0) {
      this.academic.getClassrooms(0, 100).subscribe({
        next: res => {
          this.classrooms.set(res.content);
          // Auto-select classroom for students
          if (this.isStudent()) {
            this.autoSelectStudentClassroom(res.content);
          }
        },
      });
    } else if (this.isStudent()) {
      this.autoSelectStudentClassroom(this.classrooms());
    }
  }

  private autoSelectStudentClassroom(classrooms: ClassroomResponse[]): void {
    this.studentSrv.getMyProfile().subscribe({
      next: student => {
        const match = classrooms.find(c =>
          c.name === student.currentClass
        );
        if (match) this.selectClassroom(match.id);
      },
    });
  }

  selectClassroom(id: number): void {
    this.selectedClassroomId.set(id);
    const termId = this.selectedTermId();
    if (!termId) return;
    this.isLoadingSlots.set(true);
    this.slots.set([]);

    this.academic.getTimetableByClassroom(id, termId).subscribe({
      next:  slots => {
        this.slots.set(slots);
        // Load enrolled subject IDs for student filtering
        if (this.isStudent()) {
          this.academic.getMyEnrolledSubjects(termId).pipe(
            catchError(() => of([])),
          ).subscribe({
            next: enrolled => {
              this.enrolledSubjectIds.set(new Set(enrolled.map(e => e.subjectId)));
              this.isLoadingSlots.set(false);
            },
          });
        } else {
          this.isLoadingSlots.set(false);
        }
      },
      error: () => { this.isLoadingSlots.set(false); },
    });
  }

  getSlots(day: DayOfWeek, time: string): TimetableResponse[] {
    return this.gridMap().get(`${day}__${time}`) ?? [];
  }

  slotColor(subjectId: number): string {
    return this.colorMap.get(subjectId) ?? 'slot--teal';
  }

  readonly filteredSubjects = computed(() => {
    const q = this.subjectSearch().toLowerCase();
    return this.subjects().filter(s => !q || s.name.toLowerCase().includes(q));
  });

  toggleSubject(subjectId: number): void {
    this.selectedSubjectIds.update(ids => {
      const next = new Set(ids);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.add(subjectId);
      return next;
    });
  }

  // Opens the add-slot panel pre-filled with the clicked cell's day + time
  openAddSlot(day: DayOfWeek, time: string): void {
    this.prefillDay.set(day);
    this.prefillTime.set(time);
    this.editingSlot.set(null);
    this.selectedSubjectIds.set(new Set());
    this.subjectSearch.set('');
    this.form.reset();
    this.form.patchValue({
      dayOfWeek: day,
      startTime: time,
      endTime:   this.nextSlot(time),
    });
    this.errorMessage.set(null);
    this.panelOpen.set(true);
  }

  // Opens the edit-slot panel pre-filled with an existing slot
  openEditSlot(slot: TimetableResponse, event: Event): void {
    event.stopPropagation();
    this.prefillDay.set(slot.dayOfWeek);
    this.prefillTime.set(slot.startTime.slice(0, 5));
    this.editingSlot.set(slot);
    this.form.reset();
    this.form.patchValue({
      subjectId: slot.subjectId,
      teacherId: slot.teacherId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime.slice(0, 5),
      endTime:   slot.endTime.slice(0, 5),
    });
    this.errorMessage.set(null);
    this.panelOpen.set(true);
  }

  // Returns the next time slot as a suggested end time
  private nextSlot(time: string): string {
    const idx = TIME_SLOTS.indexOf(time);
    return idx >= 0 && idx < TIME_SLOTS.length - 1
      ? TIME_SLOTS[idx + 1]
      : time;
  }

  async deleteSlot(slot: TimetableResponse, event: Event): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirm.confirm({
      title: 'Remove Timetable Slot',
      message: `Remove ${slot.subjectName} on ${slot.dayOfWeek}?`,
      confirmText: 'Remove',
    });
    if (!confirmed) return;
    this.academic.deleteTimetableEntry(slot.id).subscribe({
      next: () => this.slots.update(list => list.filter(s => s.id !== slot.id)),
    });
  }

  submit(): void {
    const editing = this.editingSlot();

    // In add mode, only validate teacher + day + time (subjects come from checkboxes)
    if (editing) {
      if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    } else {
      const partialInvalid =
        this.form.controls.teacherId.invalid ||
        this.form.controls.dayOfWeek.invalid ||
        this.form.controls.startTime.invalid ||
        this.form.controls.endTime.invalid;
      if (partialInvalid) { this.form.markAllAsTouched(); return; }
      if (this.selectedSubjectIds().size === 0) {
        this.errorMessage.set('Select at least one subject');
        return;
      }
    }
    const classroomId = this.selectedClassroomId();
    const sessionId = this.selectedSessionId();
    const termId = this.selectedTermId();
    if (!classroomId || !termId || !sessionId) return;

    this.isSubmitting.set(true);
    const v = this.form.getRawValue();

    if (editing) {
      // Update existing slot
      this.academic.updateTimetableEntry(editing.id, {
        subjectId: v.subjectId!,
        teacherId: v.teacherId!,
        dayOfWeek: v.dayOfWeek!,
        startTime: v.startTime!,
        endTime:   v.endTime!,
      }).subscribe({
        next: updated => {
          this.slots.update(list => list.map(s => s.id === updated.id ? updated : s));
          this.closePanel();
          this.isSubmitting.set(false);
        },
        error: err => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to update slot');
          this.isSubmitting.set(false);
        },
      });
    } else {
      // Create new slots — one per selected subject
      const subjectIds = Array.from(this.selectedSubjectIds());
      if (subjectIds.length === 0) {
        this.errorMessage.set('Select at least one subject');
        this.isSubmitting.set(false);
        return;
      }

      let created = 0;
      let errors = 0;
      const total = subjectIds.length;

      for (const subjectId of subjectIds) {
        this.academic.createTimetableEntry({
          sessionId,
          termId,
          classroomId,
          subjectId,
          teacherId: v.teacherId!,
          dayOfWeek: v.dayOfWeek!,
          startTime: v.startTime!,
          endTime:   v.endTime!,
        }).subscribe({
          next: slot => {
            this.slots.update(list => [...list, slot]);
            created++;
            if (created + errors === total) {
              this.closePanel();
              this.isSubmitting.set(false);
            }
          },
          error: err => {
            errors++;
            if (created + errors === total) {
              this.errorMessage.set(
                errors === total
                  ? (err?.error?.message ?? 'Failed to add slots')
                  : `Added ${created} of ${total} (${errors} failed)`
              );
              this.isSubmitting.set(false);
            }
          },
        });
      }
    }
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.prefillDay.set(null);
    this.prefillTime.set(null);
    this.editingSlot.set(null);
    this.errorMessage.set(null);
    this.form.reset();
  }

  formatDay(day: DayOfWeek): string {
    return day.charAt(0) + day.slice(1).toLowerCase();
  }
}
