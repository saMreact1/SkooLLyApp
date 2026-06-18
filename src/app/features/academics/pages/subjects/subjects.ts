import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AcademicService} from '../../services/academic.service';
import {SubjectResponse} from '../../models/academic.model';
import {ConfirmationService} from '../../../../shared/components/confirmation-modal/confirmation.service';
import {PagedResponse} from '../../../../shared/models/paged-response.model';
import {Paginator} from '../../../../shared/components/paginator/paginator';

@Component({
  selector: 'app-subjects',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    Paginator,
  ],
  templateUrl: './subjects.html',
  styleUrls: ['./subjects.css', '../../../../../styles/academics.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Subjects implements OnInit {
  private readonly academic = inject(AcademicService);
  private readonly fb       = inject(FormBuilder);
  private readonly confirm  = inject(ConfirmationService);

  readonly pagedResponse = signal<PagedResponse<SubjectResponse> | null>(null);
  readonly currentPage = signal(0);
  readonly pageSize = signal(20);

  readonly subjects = computed(() => this.pagedResponse()?.content ?? []);
  readonly isLoading    = signal(true);
  readonly isSubmitting = signal(false);
  readonly panelOpen    = signal(false);
  readonly editTarget   = signal<SubjectResponse | null>(null);
  readonly searchQuery  = signal('');
  readonly showElectives = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly categorySuggestions = [
    'Sciences', 'Arts', 'Commercial',
    'Languages', 'Vocational', 'Social Sciences', 'Technology'
  ];

  readonly form = this.fb.group({
    name:        ['', Validators.required],
    code:        ['', Validators.required],
    category:    [''],
    description: [''],
      isElective: [false],
  });

  readonly filtered = computed<SubjectResponse[]>(() => {
    let list = this.subjects();
    if (this.showElectives()) {
      list = list.filter(s => s.isElective);
    }
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


  ngOnInit(): void { this.load(); }

  load(): void {
    this.academic.getSubjects(this.currentPage(), this.pageSize()).subscribe({
      next:  res => { this.pagedResponse.set(res); this.isLoading.set(false); },
      error: ()  => { this.isLoading.set(false); },
    });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  openCreate(): void {
    this.editTarget.set(null);
    this.form.reset({ isElective: false });
    this.panelOpen.set(true)
    this.errorMessage.set(null)
  }

  openEdit(subject: SubjectResponse): void {
    this.editTarget.set(subject);
    this.form.patchValue({
      name: subject.name,
      code: subject.code,
      category: subject.category ?? '',
      description: subject.description ?? '',
      isElective: subject.isElective,
    })
    this.form.patchValue(subject);
    this.panelOpen.set(true);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSubmitting.set(true);
    const v = this.form.getRawValue();
    const target = this.editTarget();

    const req$ = target
      ? this.academic.updateSubject(target.id, {
        name: v.name || undefined,
        code: v.code || undefined,
        description: v.description || undefined,
        category: v.category || undefined,
        isElective: v.isElective ?? undefined,
      })
      : this.academic.createSubject({
        name: v.name!,
        code: v.code!,
        description: v.description! || undefined,
        category: v.category! || undefined,
        isElective: v.isElective ?? false,
      });

    req$.subscribe({
      next: () => {
        if (!target) { this.currentPage.set(0); }
        this.load();
        this.closePanel();
        this.isSubmitting.set(false);
      },
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Operation failed');
        this.isSubmitting.set(false);
      },
    });
  }

  toggleActive(subject: SubjectResponse): void {
    this.academic.updateSubject(subject.id, { active: !subject.active })
      .subscribe({ next: () => this.load() });
  }

  async delete(subject: SubjectResponse): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Delete Subject',
      message: `Delete "${subject.name}"? This cannot be undone.`,
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    this.academic.deleteSubject(subject.id).subscribe({
      next: () => this.load(),
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.editTarget.set(null);
    this.errorMessage.set(null);
  }
}
