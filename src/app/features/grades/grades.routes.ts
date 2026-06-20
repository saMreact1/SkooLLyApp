import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards/role.guard';

export const GRADES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'list',
  },
  {
    path: 'list',
    canActivate: [roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
    loadComponent: () =>
      import('./pages/exam-list/exam-list').then(m => m.ExamList),
  },
  {
    path: 'entry/:examId',
    canActivate: [roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
    loadComponent: () =>
      import('./pages/grade-entry/grade-entry').then(m => m.GradeEntry),
  },
  {
    path: 'sheet/:examId',
    canActivate: [roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
    loadComponent: () =>
      import('./pages/grade-sheet/grade-sheet').then(m => m.GradeSheet),
  },
  {
    path: 'report-card',
    canActivate: [roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'] },
    loadComponent: () =>
      import('./pages/report-card/report-card').then(m => m.ReportCard),
  },
];
