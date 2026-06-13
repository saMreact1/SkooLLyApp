import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards/role.guard';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/student-list/student-list')
        .then(m => m.StudentList),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/student-detail/student-detail')
        .then(m => m.StudentDetail),
  },
];
