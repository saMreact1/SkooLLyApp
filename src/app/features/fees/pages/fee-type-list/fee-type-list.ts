import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FeeService} from '../../services/fee.service';
import {FeeTypeResponse, FeeCategory, FEE_CATEGORY_OPTIONS, FeeTypeRequest} from '../../models/fee.models';

@Component({
  selector: 'app-fee-type-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './fee-type-list.html',
  styleUrl: './fee-type-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeeTypeList implements OnInit {
  private readonly feeService = inject(FeeService);

  readonly feeTypes = signal<FeeTypeResponse[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly showForm = signal(false);
  readonly editing = signal<FeeTypeResponse | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly formName = signal('');
  readonly formCategory = signal<FeeCategory>('TUITION');
  readonly formDescription = signal('');

  readonly categoryOptions = FEE_CATEGORY_OPTIONS;

  ngOnInit(): void {
    this.loadFeeTypes();
  }

  private loadFeeTypes(): void {
    this.isLoading.set(true);
    this.feeService.getFeeTypes(0, 50).subscribe({
      next: res => { this.feeTypes.set(res.content); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.formName.set('');
    this.formCategory.set('TUITION');
    this.formDescription.set('');
    this.showForm.set(true);
  }

  openEdit(t: FeeTypeResponse): void {
    this.editing.set(t);
    this.formName.set(t.name);
    this.formCategory.set(t.category);
    this.formDescription.set(t.description ?? '');
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  save(): void {
    if (!this.formName()) return;
    this.isSaving.set(true);
    this.errorMessage.set(null);
    const payload: FeeTypeRequest = { name: this.formName(), category: this.formCategory(), description: this.formDescription() || undefined };
    const obs = this.editing()
      ? this.feeService.updateFeeType(this.editing()!.id, payload)
      : this.feeService.createFeeType(payload);
    obs.subscribe({
      next: () => {
        this.successMessage.set(this.editing() ? 'Fee type updated' : 'Fee type created');
        this.isSaving.set(false);
        this.closeForm();
        this.loadFeeTypes();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Failed to save');
        this.isSaving.set(false);
      },
    });
  }

  delete(t: FeeTypeResponse): void {
    if (!confirm(`Delete fee type "${t.name}"?`)) return;
    this.feeService.deleteFeeType(t.id).subscribe({
      next: () => {
        this.successMessage.set('Fee type deleted');
        this.loadFeeTypes();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
    });
  }
}
