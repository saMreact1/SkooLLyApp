import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TokenService } from '../../../../core/auth/services/token.service';
import { CommunicationService } from '../../services/communication.service';
import {
  Announcement,
  AnnouncementTarget,
  AnnouncementPriority,
  CommunicationFilters,
} from '../../models/communication.models';
import { ConfirmationService } from '../../../../shared/components/confirmation-modal';
import { PagedResponse } from '../../../../shared/models/paged-response.model';
import { Paginator } from '../../../../shared/components/paginator/paginator';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Paginator],
  templateUrl: './announcements.html',
  styleUrl: './announcements.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Announcements implements OnInit {
  private readonly communicationService = inject(CommunicationService);
  private readonly tokenService = inject(TokenService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);

  readonly pagedResponse = signal<PagedResponse<Announcement> | null>(null);
  readonly currentPage = signal(0);
  readonly pageSize = signal(20);
  readonly announcements = computed(() => this.pagedResponse()?.content ?? []);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly showFilters = signal(false);
  readonly currentRole = this.tokenService.currentRole;

  readonly targets: { value: AnnouncementTarget; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'STUDENTS', label: 'Students' },
    { value: 'TEACHERS', label: 'Teachers' },
    { value: 'PARENTS', label: 'Parents' },
    { value: 'STAFF', label: 'Staff' },
  ];

  readonly priorities: { value: AnnouncementPriority; label: string }[] = [
    { value: 'LOW', label: 'Low' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  readonly filterForm = this.fb.group({
    target: ['' as AnnouncementTarget | ''],
    priority: ['' as AnnouncementPriority | ''],
    published: [true],
    search: [''],
  });

  readonly filteredAnnouncements = computed(() => {
    let list = this.announcements();
    const filters = this.filterForm.value;

    if (filters.target) {
      list = list.filter(a => a.target === filters.target);
    }
    if (filters.priority) {
      list = list.filter(a => a.priority === filters.priority);
    }
    if (filters.published !== undefined && filters.published !== null) {
      list = list.filter(a => a.published === filters.published);
    }
    if (filters.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.postedByName.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  readonly canCreate = computed(() => {
    const role = this.currentRole();
    return role === 'SUPER_ADMIN' || role === 'ADMIN';
  });

  ngOnInit(): void {
    this.loadAnnouncements();
    this.communicationService.connect();
  }

  loadAnnouncements(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const role = this.currentRole();
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role || '');

    const obs = isAdmin
      ? this.communicationService.getAllAnnouncements(this.currentPage(), this.pageSize())
      : this.communicationService.getVisibleAnnouncements(
          role === 'STUDENT' ? 'STUDENTS'
            : role === 'TEACHER' ? 'TEACHERS'
            : role === 'PARENT' ? 'PARENTS'
            : 'ALL',
          this.currentPage(),
          this.pageSize()
        );

    obs.subscribe({
      next: (res) => {
        this.pagedResponse.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load announcements');
        this.isLoading.set(false);
      },
    });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadAnnouncements();
  }

  refresh(): void {
    this.loadAnnouncements();
  }

  clearFilters(): void {
    this.filterForm.reset({ target: '', priority: '', published: true, search: '' });
  }

  createAnnouncement(): void {
    this.router.navigate(['/app/communication/announcements/create']);
  }

  editAnnouncement(announcement: Announcement, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/app/communication/announcements', announcement.id, 'edit']);
  }

  async deleteAnnouncement(announcement: Announcement, event: Event): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirm.confirm({
      title: 'Delete Announcement',
      message: `Delete "${announcement.title}"? This cannot be undone.`,
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    this.communicationService.deleteAnnouncement(announcement.id).subscribe({
      next: () => {
        this.loadAnnouncements();
      },
      error: () => {
        this.errorMessage.set('Failed to delete announcement');
      },
    });
  }

  getPriorityClass(priority: AnnouncementPriority): string {
    const map: Record<AnnouncementPriority, string> = {
      LOW: 'priority--low',
      NORMAL: 'priority--normal',
      HIGH: 'priority--high',
      URGENT: 'priority--urgent',
    };
    return map[priority] || 'priority--normal';
  }

  getTargetLabel(target: AnnouncementTarget): string {
    return this.targets.find(t => t.value === target)?.label || target;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
