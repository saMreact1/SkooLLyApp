import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {RegistrationState} from '../../../../core/auth/models/auth.model';
import {Step3User} from './steps/step3-user/step3-user';
import {Step2School} from './steps/step2-school/step2-school';
import {Step1Check} from './steps/step1-check/step1-check';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    RouterLink,
    Step3User,
    Step2School,
    Step1Check,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Register {
  readonly state = signal<RegistrationState>({
    step: 1,
    email: '',
    schoolName: '',
    schoolExists: false,
    schoolId: null,
    serverMessage: ''
  });

  onStep1Complete(update: Partial<RegistrationState>) {
    this.state.update(s => ({ ...s, ...update }));
  }

  onStep2Complete(schoolId: number) {
    this.state.update(s => ({ ...s, step: 3, schoolId }));
  }

  onRegistrationComplete() {
    // auth.service already stored the token and redirected
    // Nothing to do here — the guard will handle the rest
  }

  goBack() {
    this.state.update(s => ({
      ...s,
      step: (s.step > 1 ? s.step - 1 : 1) as 1 | 2 | 3
    }));
  }
}
