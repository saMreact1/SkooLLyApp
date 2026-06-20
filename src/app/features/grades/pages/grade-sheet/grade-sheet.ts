import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {GradeService} from '../../services/grade.service';
import {GradeSheetResponse, GradeSheetEntry} from '../../models/grade.models';

@Component({
  selector: 'app-grade-sheet',
  imports: [CommonModule, RouterLink],
  templateUrl: './grade-sheet.html',
  styleUrl: './grade-sheet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GradeSheet implements OnInit {
  private readonly gradeService = inject(GradeService);
  private readonly route = inject(ActivatedRoute);

  readonly sheet = signal<GradeSheetResponse | null>(null);
  readonly isLoading = signal(false);

  readonly examId = computed(() => Number(this.route.snapshot.paramMap.get('examId')));

  readonly sortedGrades = computed(() => {
    const grades = this.sheet()?.grades ?? [];
    return [...grades].sort((a, b) => b.marksObtained - a.marksObtained);
  });

  ngOnInit(): void {
    this.isLoading.set(true);
    this.gradeService.getGradeSheet(this.examId()).subscribe({
      next: sheet => {
        this.sheet.set(sheet);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  rankFor(index: number): number {
    return index + 1;
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
