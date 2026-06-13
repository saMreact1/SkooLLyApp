import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {SchoolType} from '../../../../../../core/auth/models/auth.model';
import {AuthService} from '../../../../../../core/auth/services/auth.service';
import {CommonModule} from '@angular/common';
import {of, switchMap} from 'rxjs';

@Component({
  selector: 'app-step2-school',
  imports: [
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './step2-school.html',
  encapsulation: ViewEncapsulation.None,
  styleUrl: './step2-school.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Step2School {
  @Input({ required: true }) email!: string;
  @Input({ required: true }) schoolName!: string;

  @Output() stepComplete = new EventEmitter<number>(); // emits schoolId
  @Output() back         = new EventEmitter<void>();

  private readonly auth = inject(AuthService);
  private readonly fb   = inject(FormBuilder);

  readonly isLoading    = signal(false);
  readonly isUploading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly logoPreview = signal<string | null>(null);
  private selectedFile: File | null = null;
  private uploadedLogoUrl: string | null = null;

  readonly schoolTypes: { value: SchoolType; label: string }[] = [
    { value: 'NURSERY', label: 'Nursery school' },
    { value: 'PRIMARY', label: 'Primary school' },
    { value: 'SECONDARY', label: 'Secondary school' },
    { value: "NURSERY_AND_PRIMARY", label: 'Nursery & Primary' },
    { value: 'PRIMARY_SECONDARY', label: 'Primary & Secondary' },
    { value: 'NURSERY_AND_PRIMARY_AND_SECONDARY', label: 'Nursery, Primary and Secondary' },
    { value: 'TERTIARY', label: 'Tertiary institution' },
  ];

  readonly form = this.fb.group({
    name:        ['', Validators.required],
    email:       ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    address:     ['', Validators.required],
    city:        ['', Validators.required],
    state:       ['', Validators.required],
    type:        ['' as SchoolType, Validators.required],
  });

  // Pre-fill name from step 1
  ngOnInit(): void {
    this.form.patchValue({ name: this.schoolName });
  }

  get f() { return this.form.controls; }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.processLogoFile(file);
  }

  onLogoDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.processLogoFile(file);
    }
  }

  // Convert file to base64, set preview
  private processLogoFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage.set('Logo must be less than 10MB');
      return;
    }
    this.selectedFile = file;
    this.uploadedLogoUrl = null

    const objectUrl = URL.createObjectURL(file);
    this.logoPreview.set(objectUrl);
  }

  removeLogo(event: MouseEvent): void {
    event.stopPropagation();
    this.logoPreview.set(null);
    this.selectedFile = null;
    this.uploadedLogoUrl = null;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const upload$ = this.selectedFile
      ? this.auth.uploadFile(this.selectedFile, 'schools')
      : of({url: ''});

    upload$.pipe(
      switchMap(uploadResult => {
        const logoUrl = uploadResult?.url ?? undefined;
        return this.auth.createSchool({
          ...this.form.getRawValue() as any,
          logoUrl,
        });
      })
    ).subscribe({
      next: (school) => {
        this.isLoading.set(false);
        this.stepComplete.emit(school.id);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ?? 'Could not create school. Please try again.'
        );
      },
    });
  }
}
