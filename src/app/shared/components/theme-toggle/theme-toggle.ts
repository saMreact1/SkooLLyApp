import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  private readonly themeService = inject(ThemeService);

  readonly isDark = this.themeService.isDark;

  toggle(): void {
    this.themeService.toggle();
  }
}
