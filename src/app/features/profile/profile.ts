import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Profile implements OnInit {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.currentUser;
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);
  readonly uploading = signal(false);

  firstName = '';
  lastName = '';
  phoneNumber = '';
  address = '';

  readonly avatarText = computed(() => {
    const u = this.user();
    return u ? `${u.firstName[0]}${u.lastName[0]}` : '';
  });

  readonly roleName = computed(() => {
    const u = this.user();
    if (!u) return '';
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      ADMIN: 'Admin',
      TEACHER: 'Teacher',
      STUDENT: 'Student',
      PARENT: 'Parent',
    };
    return roleMap[u.role] || u.role;
  });

  ngOnInit(): void {
    this.initFromCache();
    this.loadProfile();
  }

  private initFromCache(): void {
    const u = this.user();
    if (u) {
      this.firstName = u.firstName || '';
      this.lastName = u.lastName || '';
      this.phoneNumber = u.phoneNumber || '';
      this.address = u.address || '';
    }
  }

  loadProfile(): void {
    this.loading.set(true);
    this.authService.getMyProfile().subscribe({
      next: (profile) => {
        this.firstName = profile.firstName || '';
        this.lastName = profile.lastName || '';
        this.phoneNumber = profile.phoneNumber || '';
        this.address = profile.address || '';
        this.loading.set(false);
      },
      error: () => {
        this.initFromCache();
        this.loading.set(false);
      },
    });
  }

  onFieldChange(field: string, value: string): void {
    (this as any)[field] = value;
    this.success.set(false);
    this.error.set(null);
  }

  saveProfile(): void {
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.error.set('First name and last name are required');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: any = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      phoneNumber: this.phoneNumber.trim(),
      address: this.address.trim(),
    };

    this.authService.updateMyProfile(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
        setTimeout(() => this.success.set(false), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Failed to update profile');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('File size must be less than 5MB');
      return;
    }

    this.uploading.set(true);
    this.authService.uploadFile(file, 'profiles').subscribe({
      next: (res) => {
        this.authService.updateMyProfile({ profilePictureUrl: res.url } as any).subscribe({
          next: () => {
            this.uploading.set(false);
            this.success.set(true);
            setTimeout(() => this.success.set(false), 3000);
          },
          error: () => this.uploading.set(false),
        });
      },
      error: () => this.uploading.set(false),
    });
  }
}
