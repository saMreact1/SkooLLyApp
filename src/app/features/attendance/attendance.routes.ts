import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards/role.guard';

export const ATTENDANCE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
    loadComponent: () =>
      import('./pages/attendance-list/attendance-list')
        .then(m => m.AttendanceList),
  },
];
