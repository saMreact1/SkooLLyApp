import {Injectable, computed, signal} from '@angular/core';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
}

export interface ConfirmationState {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  resolve: ((value: boolean) => void) | null;
}

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly _state = signal<ConfirmationState>({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    resolve: null,
  });

  readonly state = this._state.asReadonly();

  confirm(config: ConfirmationConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this._state.set({
        visible: true,
        title: config.title,
        message: config.message,
        confirmText: config.confirmText ?? 'Delete',
        resolve,
      });
    });
  }

  confirmAction(): void {
    const current = this._state();
    if (current.resolve) {
      current.resolve(true);
    }
    this._state.update((s) => ({ ...s, visible: false, resolve: null }));
  }

  cancelAction(): void {
    const current = this._state();
    if (current.resolve) {
      current.resolve(false);
    }
    this._state.update((s) => ({ ...s, visible: false, resolve: null }));
  }
}