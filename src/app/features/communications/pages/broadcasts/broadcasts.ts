import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-broadcasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1 class="page-title">Broadcasts</h1>
        <p class="page-subtitle">Broadcast messages to the entire school</p>
      </header>
      <div class="empty-state">
        <p>Broadcasts feature coming soon.</p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Broadcasts {}
