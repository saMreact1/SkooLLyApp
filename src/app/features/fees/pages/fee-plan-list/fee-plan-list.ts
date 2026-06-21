import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FeeService} from '../../services/fee.service';
import {AcademicService} from '../../../academics/services/academic.service';
import {FeePlanResponse, FeePlanRequest, FeeTypeResponse} from '../../models/fee.models';
import {ClassroomResponse, TermResponse, SessionResponse} from '../../../academics/models/academic.model';

@Component({
  selector: 'app-fee-plan-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './fee-plan-list.html',
  styleUrl: './fee-plan-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeePlanList implements OnInit {
  private readonly feeService = inject(FeeService);
  private readonly academicService = inject(AcademicService);

  readonly feePlans = signal<FeePlanResponse[]>([]);
  readonly feeTypes = signal<FeeTypeResponse[]>([]);
  readonly classrooms = signal<ClassroomResponse[]>([]);
  readonly terms = signal<TermResponse[]>([]);
  readonly currentSession = signal<SessionResponse | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly showForm = signal(false);
  readonly editing = signal<FeePlanResponse | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedClassroomId = signal<number | null>(null);
  readonly selectedTermId = signal<number | null>(null);

  readonly formFeeTypeId = signal<number | null>(null);
  readonly formClassroomId = signal<number | null>(null);
  readonly formTermId = signal<number | null>(null);
  readonly formAmount = signal<number>(0);
  readonly formDueDate = signal('');
  readonly formIsOptional = signal(false);
  readonly formDescription = signal('');

  ngOnInit(): void {
    this.loadMeta();
  }

  private loadMeta(): void {
    this.feeService.getActiveFeeTypes().subscribe({ next: res => this.feeTypes.set(res) });
    this.academicService.getClassrooms(0, 100).subscribe({ next: res => this.classrooms.set(res.content) });
    this.academicService.getSessions(0, 20).subscribe({
      next: res => {
        const s = res.content.find(x => x.status === 'ACTIVE') ?? res.content[0];
        this.currentSession.set(s ?? null);
        if (s) this.academicService.getTermsBySession(s.id).subscribe({ next: (t: any[]) => this.terms.set(t) });
      },
    });
  }

  private loadPlans(): void {
    this.isLoading.set(true);
    this.feeService.getFeePlans(0, 100).subscribe({
      next: res => { this.feePlans.set(res.content); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  onClassChange(classroomId: number | null): void {
    this.selectedClassroomId.set(classroomId);
    if (classroomId !== null) {
      this.loadPlans();
    } else {
      this.feePlans.set([]);
    }
  }

  openCreate(): void {
    this.editing.set(null);
    this.formFeeTypeId.set(null);
    this.formClassroomId.set(null);
    this.formTermId.set(null);
    this.formAmount.set(0);
    this.formDueDate.set('');
    this.formIsOptional.set(false);
    this.formDescription.set('');
    this.showForm.set(true);
  }

  openEdit(p: FeePlanResponse): void {
    this.editing.set(p);
    this.formFeeTypeId.set(p.feeTypeId);
    this.formClassroomId.set(p.classroomId);
    this.formTermId.set(p.termId);
    this.formAmount.set(p.amount);
    this.formDueDate.set(p.dueDate);
    this.formIsOptional.set(p.isOptional);
    this.formDescription.set(p.description ?? '');
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editing.set(null); }

  save(): void {
    if (!this.formFeeTypeId() || !this.formClassroomId() || !this.formTermId() || !this.formAmount() || !this.formDueDate()) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);
    const payload: FeePlanRequest = {
      feeTypeId: this.formFeeTypeId()!,
      classroomId: this.formClassroomId()!,
      sessionId: this.currentSession()?.id ?? 0,
      termId: this.formTermId()!,
      amount: this.formAmount(),
      dueDate: this.formDueDate(),
      isOptional: this.formIsOptional(),
      description: this.formDescription() || undefined,
    };
    const obs = this.editing()
      ? this.feeService.updateFeePlan(this.editing()!.id, payload)
      : this.feeService.createFeePlan(payload);
    obs.subscribe({
      next: () => {
        this.successMessage.set(this.editing() ? 'Fee plan updated' : 'Fee plan created');
        this.isSaving.set(false);
        this.closeForm();
        this.loadPlans();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => { this.errorMessage.set(err.error?.message ?? 'Failed'); this.isSaving.set(false); },
    });
  }

  delete(p: FeePlanResponse): void {
    if (!confirm(`Delete fee plan?`)) return;
    this.feeService.deleteFeePlan(p.id).subscribe({
      next: () => { this.successMessage.set('Fee plan deleted'); this.loadPlans(); setTimeout(() => this.successMessage.set(null), 3000); },
    });
  }

  filteredPlans = () => {
    let list = this.feePlans();
    const c = this.selectedClassroomId();
    const t = this.selectedTermId();
    if (c !== null) list = list.filter(p => p.classroomId === c);
    if (t !== null) list = list.filter(p => p.termId === t);
    return list;
  };
}
