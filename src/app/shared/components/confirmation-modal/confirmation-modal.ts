import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ConfirmationService} from './confirmation.service';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-modal.html',
  styleUrl: './confirmation-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationModal {
  private readonly service = inject(ConfirmationService);

  readonly state = this.service.state;

  onConfirm(): void {
    this.service.confirmAction();
  }

  onCancel(): void {
    this.service.cancelAction();
  }
}
