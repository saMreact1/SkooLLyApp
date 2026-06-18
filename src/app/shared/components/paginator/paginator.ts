import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagedResponse } from '../../models/paged-response.model';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (pageData(); as p) {
      <div class="paginator">
        <span class="paginator__info">
          {{ (p.page * p.size) + 1 }}–{{ (p.page * p.size) + p.content.length }}
          of {{ p.totalElements }}
        </span>
        <div class="paginator__controls">
          <button
            class="paginator__btn"
            [disabled]="p.first"
            (click)="goToPage.emit(0)"
            aria-label="First page"
          >
            ««
          </button>
          <button
            class="paginator__btn"
            [disabled]="p.first"
            (click)="goToPage.emit(p.page - 1)"
            aria-label="Previous page"
          >
            «
          </button>

          @for (n of visiblePages(); track n) {
            <button
              class="paginator__btn"
              [class.paginator__btn--active]="n === p.page"
              (click)="goToPage.emit(n)"
            >
              {{ n + 1 }}
            </button>
          }

          <button
            class="paginator__btn"
            [disabled]="p.last"
            (click)="goToPage.emit(p.page + 1)"
            aria-label="Next page"
          >
            »
          </button>
          <button
            class="paginator__btn"
            [disabled]="p.last"
            (click)="goToPage.emit(p.totalPages - 1)"
            aria-label="Last page"
          >
            »»
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .paginator {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .paginator__info {
      font-size: 0.8125rem;
      color: #64748b;
    }
    .paginator__controls {
      display: flex;
      gap: 0.25rem;
    }
    .paginator__btn {
      min-width: 2rem;
      height: 2rem;
      border: 1px solid #e2e8f0;
      background: #fff;
      border-radius: 6px;
      font-size: 0.8125rem;
      color: #334155;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      padding: 0 0.375rem;
    }
    .paginator__btn:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    .paginator__btn:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .paginator__btn--active {
      background: #2563eb;
      border-color: #2563eb;
      color: #fff;
    }
    .paginator__btn--active:hover {
      background: #1d4ed8;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Paginator {
  readonly pageData = input.required<PagedResponse<unknown>>();
  readonly goToPage = output<number>();

  readonly visiblePages = computed(() => {
    const p = this.pageData();
    const total = p.totalPages;
    const current = p.page;
    const maxVisible = 5;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i);
    }

    let start = Math.max(0, current - Math.floor(maxVisible / 2));
    let end = start + maxVisible;
    if (end > total) {
      end = total;
      start = Math.max(0, end - maxVisible);
    }
    return Array.from({ length: end - start }, (_, i) => start + i);
  });
}
