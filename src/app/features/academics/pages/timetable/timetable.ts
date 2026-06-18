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
import {TeacherService} from '../../../teachers/services/teacher.service';
import {TeacherResponse} from '../../../teachers/models/teacher.models';
import {ConfirmationService} from '../../../../shared/components/confirmation-modal/confirmation.service';

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
  readonly selectedClassroomId = signal<number | null>(null);
  readonly selectedSessionId = signal<number | null>(null);
  readonly selectedTermId = signal<number | null>(null);
  readonly isLoadingSessions     = signal(true);
  readonly isLoadingTerms  = signal<boolean>(false);
  readonly isLoadingSlots     = signal(false);
  readonly isSubmitting       = signal(false);
  readonly panelOpen          = signal(false);
  readonly errorMessage       = signal<string | null>(null);

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

  private readonly colorMap = new Map<number, string>();

  // ─── Derived: 2D grid lookup map[day][time] → slot | null ─────────────────
  readonly gridMap = computed(() => {
    const map = new Map<string, TimetableResponse>();
    for (const slot of this.slots()) {
      const timeKey = slot.startTime.slice(0, 5);
      map.set(`${slot.dayOfWeek}__${timeKey}`, slot);
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
        next: res => this.classrooms.set(res.content),
      });
    }
  }

  selectClassroom(id: number): void {
    this.selectedClassroomId.set(id);
    const termId = this.selectedTermId();
    if (!termId) return;
    this.isLoadingSlots.set(true);
    this.slots.set([]);

    this.academic.getTimetableByClassroom(id, termId).subscribe({
      next:  slots => { this.slots.set(slots); this.isLoadingSlots.set(false); },
      error: ()    => { this.isLoadingSlots.set(false); },
    });
  }

  getSlot(day: DayOfWeek, time: string): TimetableResponse | null {
    return this.gridMap().get(`${day}__${time}`) ?? null;
  }

  slotColor(subjectId: number): string {
    return this.colorMap.get(subjectId) ?? 'slot--teal';
  }

  // Opens the add-slot panel pre-filled with the clicked cell's day + time
  openAddSlot(day: DayOfWeek, time: string): void {
    this.prefillDay.set(day);
    this.prefillTime.set(time);
    this.form.reset();
    this.form.patchValue({
      dayOfWeek: day,
      startTime: time,
      endTime:   this.nextSlot(time),
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
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const classroomId = this.selectedClassroomId();
    const sessionId = this.selectedSessionId();
    const termId = this.selectedTermId();
    if (!classroomId || !termId || !sessionId) return;

    this.isSubmitting.set(true);
    const v = this.form.getRawValue();

    this.academic.createTimetableEntry({
      sessionId,
      termId,
      classroomId,
      subjectId: v.subjectId!,
      teacherId: v.teacherId!,
      dayOfWeek: v.dayOfWeek!,
      startTime: v.startTime!,
      endTime:   v.endTime!,
    }).subscribe({
      next: slot => {
        this.slots.update(list => [...list, slot]);
        this.closePanel();
        this.isSubmitting.set(false);
      },
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to add slot');
        this.isSubmitting.set(false);
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.prefillDay.set(null);
    this.prefillTime.set(null);
    this.errorMessage.set(null);
    this.form.reset();
  }

  formatDay(day: DayOfWeek): string {
    return day.charAt(0) + day.slice(1).toLowerCase();
  }
}
