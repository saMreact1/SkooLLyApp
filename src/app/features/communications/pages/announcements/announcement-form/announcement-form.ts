import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommunicationService } from '../../../services/communication.service';
import {
  Announcement,
  AnnouncementTarget,
  AnnouncementPriority,
} from '../../../models/communication.models';

@Component({
  selector: 'app-announcement-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './announcement-form.html',
  styleUrl: './announcement-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementForm implements OnInit {
  private readonly communicationService = inject(CommunicationService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEditMode = signal(false);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

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

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', [Validators.required, Validators.minLength(10)]],
    target: ['ALL' as AnnouncementTarget],
    priority: ['NORMAL' as AnnouncementPriority],
    published: [true],
    publishAt: [''],
    expiresAt: [''],
  });

  private announcementId: number | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.announcementId = Number(idParam);
      this.isEditMode.set(true);
      this.loadAnnouncement();
    }
  }

  private loadAnnouncement(): void {
    if (!this.announcementId) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.communicationService.getAnnouncementById(this.announcementId).subscribe({
      next: (announcement) => {
        this.form.patchValue({
          title: announcement.title,
          content: announcement.content,
          target: announcement.target,
          priority: announcement.priority,
          published: announcement.published,
          publishAt: announcement.publishAt
            ? this.toDatetimeLocal(announcement.publishAt)
            : '',
          expiresAt: announcement.expiresAt
            ? this.toDatetimeLocal(announcement.expiresAt)
            : '',
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load announcement');
        this.isLoading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();

    if (this.isEditMode() && this.announcementId) {
      this.communicationService.updateAnnouncement(this.announcementId, {
        title: raw.title || undefined,
        content: raw.content || undefined,
        target: raw.target || undefined,
        priority: raw.priority || undefined,
        published: raw.published ?? undefined,
        publishAt: raw.publishAt ? new Date(raw.publishAt).toISOString() : undefined,
        expiresAt: raw.expiresAt ? new Date(raw.expiresAt).toISOString() : undefined,
      }).subscribe({
        next: () => this.router.navigate(['/app/communication/announcements']),
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to update announcement');
          this.isSubmitting.set(false);
        },
      });
    } else {
      this.communicationService.createAnnouncement({
        title: raw.title!,
        content: raw.content!,
        target: raw.target || undefined,
        priority: raw.priority || undefined,
        published: raw.published ?? undefined,
        publishAt: raw.publishAt ? new Date(raw.publishAt).toISOString() : undefined,
        expiresAt: raw.expiresAt ? new Date(raw.expiresAt).toISOString() : undefined,
      }).subscribe({
        next: () => this.router.navigate(['/app/communication/announcements']),
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to create announcement');
          this.isSubmitting.set(false);
        },
      });
    }
  }

  private toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
