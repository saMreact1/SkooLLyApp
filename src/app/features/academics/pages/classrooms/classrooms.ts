import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AcademicService} from '../../services/academic.service';
import {ClassroomResponse} from '../../models/academic.model';
import {TeacherService} from '../../../teachers/services/teacher.service';
import {TeacherResponse} from '../../../teachers/models/teacher.models';
import {ConfirmationService} from '../../../../shared/components/confirmation-modal/confirmation.service';

@Component({
  selector: 'app-classrooms',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './classrooms.html',
  styleUrl: './classrooms.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Classrooms implements OnInit {
  private readonly academic = inject(AcademicService);
  private readonly teacherSrv   = inject(TeacherService);
  private readonly fb       = inject(FormBuilder);
  private readonly confirm  = inject(ConfirmationService);

  // readonly sessions          = signal<AcademicSessionResponse[]>([]);
  readonly classrooms        = signal<ClassroomResponse[]>([]);
  readonly teachers         = signal<TeacherResponse[]>([]);
  readonly selectedSessionId = signal<number | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting      = signal(false);
  readonly panelOpen         = signal(false);
  readonly editTarget =signal<ClassroomResponse | null>(null)
  readonly searchQuery       = signal('');
  readonly levelFilter = signal<string>('ALL');
  readonly errorMessage      = signal<string | null>(null);

  readonly createForm = this.fb.group({
    name:          ['', Validators.required],
    section:       ['', Validators.required],
    description:   [''],
    capacity:      [null as number | null],
    classTeacherId:[null as number | null],
    level:         [''],
  });

  readonly editForm = this.fb.group({
    name:          [''],
    section:       [''],
    description:   [''],
    capacity:      [null as number | null],
    classTeacherId:[null as number | null],
    level:         [''],
    active:        [true],
  });

  // Derive unique levels from loaded classrooms for the filter
  readonly levels = computed<string[]>(() => {
    const all = this.classrooms()
      .map(c => c.level)
      .filter((l): l is string => !!l);
    return ['ALL', ...new Set(all)];
  });

  readonly filtered = computed<ClassroomResponse[]>(() => {
    let list = this.classrooms();
    const level = this.levelFilter();
    if (level !== 'ALL') {
      list = list.filter(c => c.level === level);
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q) ||
        (c.level ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.loadClassrooms();
    this.teacherSrv.getAll().subscribe({
      next: list => this.teachers.set(list),
    });
  }

  loadClassrooms(): void {
    this.isLoading.set(true);
    this.academic.getClassrooms().subscribe({
      next:  list => { this.classrooms.set(list); this.isLoading.set(false); },
      error: ()    => { this.isLoading.set(false); },
    });
  }

  openCreate(): void {
    this.createForm.reset();
    this.editTarget.set(null)
    this.errorMessage.set(null);
    this.panelOpen.set(true);
  }

  openEdit(room: ClassroomResponse): void {
    this.editTarget.set(room);
    this.editForm.patchValue({
      name:           room.name,
      section:        room.section,
      description:    room.description   ?? '',
      capacity:       room.capacity      ?? null,
      classTeacherId: room.classTeacherId ?? null,
      level:          room.level         ?? '',
      active:         room.active,
    });
    this.errorMessage.set(null);
    this.panelOpen.set(true);
  }

  submit(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.isSubmitting.set(true);
    const v = this.createForm.getRawValue();

    this.academic.createClassroom({
      name:      v.name!,
      section: v.section!,
      description:  v.description || undefined,
      capacity:  v.capacity ?? undefined,
      classTeacherId: v.classTeacherId ?? undefined,
      level: v.level || undefined,
    }).subscribe({
      next: room => {
        this.classrooms.update(list => [room, ...list]);
        this.closePanel();
        this.isSubmitting.set(false);
      },
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to create classroom');
        this.isSubmitting.set(false);
      },
    });
  }

  submitEdit(): void {
    const target = this.editTarget();
    if (!target) return;
    this.isSubmitting.set(true);
    const v = this.editForm.getRawValue();

    this.academic.updateClassroom(target.id, {
      name:           v.name           || undefined,
      section:        v.section        || undefined,
      description:    v.description    || undefined,
      capacity:       v.capacity       ?? undefined,
      classTeacherId: v.classTeacherId ?? undefined,
      level:          v.level          || undefined,
      active:         v.active         ?? undefined,
    }).subscribe({
      next: updated => {
        this.classrooms.update(list =>
          list.map(c => c.id === updated.id ? updated : c)
        );
        this.closePanel();
        this.isSubmitting.set(false);
      },
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to update classroom');
        this.isSubmitting.set(false);
      },
    });
  }

  async delete(room: ClassroomResponse): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Delete Classroom',
      message: `Delete classroom "${room.name} ${room.section}"?`,
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    this.academic.deleteClassroom(room.id).subscribe({
      next: () =>
        this.classrooms.update(list => list.filter(c => c.id !== room.id)),
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.editTarget.set(null);
    this.errorMessage.set(null);
    this.createForm.reset();
    this.editForm.reset();
  }

  teacherName(id: number | null): string {
    if (!id) return '—';
    const t = this.teachers().find(t => t.id === id);
    return t ? `${t.firstName} ${t.lastName}` : '—';
  }
}
