import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {AcademicService} from '../../services/academic.service';
import {SessionResponse, TermResponse} from '../../models/academic.model';
import {ConfirmationService} from '../../../../shared/components/confirmation-modal/confirmation.service';
import {PagedResponse} from '../../../../shared/models/paged-response.model';
import {Paginator} from '../../../../shared/components/paginator/paginator';
import {TokenService} from '../../../../core/auth/services/token.service';

@Component({
  selector: 'app-sessions',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Paginator,
  ],
  templateUrl: './sessions.html',
  styleUrl: './sessions.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Sessions implements OnInit {
  private readonly academic = inject(AcademicService);
  private fb = inject(FormBuilder);
  private readonly confirm = inject(ConfirmationService);
  private readonly tokens = inject(TokenService);

  readonly pagedResponse = signal<PagedResponse<SessionResponse> | null>(null);
  readonly currentPage = signal(0);
  readonly pageSize = signal(20);

  readonly sessions = computed(() => this.pagedResponse()?.content ?? []);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly panelOpen = signal(false);
  readonly termPanelFor = signal<SessionResponse | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly sessionForm = this.fb.group({
    name: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  })

  readonly termForm = this.fb.group({
    name: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  readonly termSuggestions = [
    'First Term', 'Second Term', 'Third Term'
  ];

  readonly currentSession = computed<SessionResponse | null>(() =>
    this.sessions().find(s => s.isCurrent) ?? null
  );

  readonly isAdmin = computed(() => {
    const r = this.tokens.currentRole();
    return r === 'ADMIN' || r === 'SUPER_ADMIN';
  });

  ngOnInit() {
    this.loadSessions()
  }

  loadSessions(): void {
    this.isLoading.set(true);
    this.academic.getSessions(this.currentPage(), this.pageSize()).subscribe({
      next:  res => { this.pagedResponse.set(res); this.isLoading.set(false); },
      error: ()  => { this.isLoading.set(false); },
    });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadSessions();
  }

  submitSession(): void {
    if (this.sessionForm.invalid) { this.sessionForm.markAllAsTouched(); return; }
    this.isSubmitting.set(true);
    const v = this.sessionForm.getRawValue();
    this.academic.createSession({
      name:      v.name!,
      startDate: v.startDate!,
      endDate:   v.endDate!,
    }).subscribe({
      next: () => {
        this.currentPage.set(0);
        this.loadSessions();
        this.panelOpen.set(false);
        this.sessionForm.reset();
        this.isSubmitting.set(false);
      },
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to create session');
        this.isSubmitting.set(false);
      },
    });
  }

  openTermPanel(session: SessionResponse): void {
    this.termPanelFor.set(session);
    this.termForm.reset();
    this.errorMessage.set(null);
  }

  setCurrentSession(session: SessionResponse): void {
    this.academic.setCurrentSession(session.id).subscribe({
      next: () => { this.loadSessions(); },
    });
  }

  setCurrentTerm(term: TermResponse): void {
    this.academic.setCurrentTerm(term.id).subscribe({
      next: () => { this.loadSessions(); },
    });
  }

  submitTerm(): void {
    if (this.termForm.invalid) { this.termForm.markAllAsTouched(); return; }
    const session = this.termPanelFor();
    if (!session) return;
    this.isSubmitting.set(true);
    const v = this.termForm.getRawValue();
    this.academic.createTerm({
      sessionId: session.id,
      name:      v.name!,
      startDate: v.startDate!,
      endDate:   v.endDate!,
    }).subscribe({
      next: () => {
        this.loadSessions();
        this.termPanelFor.set(null);
        this.isSubmitting.set(false);
      },
      error: err => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to create term');
        this.isSubmitting.set(false);
      },
    });
  }

  async deleteSession(session: SessionResponse): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Delete Session',
      message: `Delete session "${session.name}"? This cannot be undone.`,
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    this.academic.deleteSession(session.id).subscribe({
      next: () => this.loadSessions(),
    });
  }

  async deleteTerm(sessionId: number, term: TermResponse): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Delete Term',
      message: `Delete "${term.name}"?`,
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    this.academic.deleteTerm(term.id).subscribe({
      next: () => { this.loadSessions(); },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.termPanelFor.set(null);
    this.errorMessage.set(null);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }
}
