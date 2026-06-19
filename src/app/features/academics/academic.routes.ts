import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards/role.guard';

export const ACADEMIC_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'sessions',
    pathMatch: 'full',
  },
  {
    path: 'sessions',
    loadComponent: () =>
      import('./pages/sessions/sessions')
        .then(m => m.Sessions),
  },
  {
    path: 'subjects',
    loadComponent: () =>
      import('./pages/subjects/subjects')
        .then(m => m.Subjects),
  },
  {
    path: 'classrooms',
    canActivate: [roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
    loadComponent: () =>
      import('./pages/classrooms/classrooms')
        .then(m => m.Classrooms),
  },
  {
    path: 'timetable',
    loadComponent: () =>
      import('./pages/timetable/timetable')
        .then(m => m.Timetable),
  },
  {
    path: 'enrollment',
    canActivate: [roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
    loadComponent: () =>
      import('./pages/enrollment/enrollment')
        .then(m => m.Enrollment),
  },
];
