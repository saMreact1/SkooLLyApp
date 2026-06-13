import { Routes } from '@angular/router';

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
];
