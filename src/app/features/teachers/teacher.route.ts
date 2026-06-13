import { Routes } from '@angular/router';

export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/teacher-list/teacher-list')
        .then(m => m.TeacherList),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/teacher-detail/teacher-detail')
        .then(m => m.TeacherDetail),
  },
];
