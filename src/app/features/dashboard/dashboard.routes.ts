// src/app/features/dashboard/dashboard.routes.ts
import { Routes } from '@angular/router';
import { AppLayout } from '../../layouts/app-layout/app-layout';
import { roleGuard } from '../../core/auth/guards/role.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
        loadComponent: () =>
          import('./pages/admin/admin')
            .then(m => m.Admin),
      },

      // Feature modules — lazy loaded, added as we build them
      {
        path: 'students',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
        loadChildren: () =>
          import('../students/student.routes').then(m => m.STUDENT_ROUTES),
      },
      {
        path: 'teachers',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
        loadChildren: () =>
          import('../teachers/teacher.route').then(m => m.TEACHER_ROUTES),
      },
      {
        path: 'academic',
        loadChildren: () =>
          import('../academics/academic.routes').then(m => m.ACADEMIC_ROUTES),
      },
      {
        path: 'communication',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
        loadChildren: () =>
          import('../communications/communication.routes').then(m => m.COMMUNICATION_ROUTES),
      },
      // {
      //   path: 'examinations',
      //   loadChildren: () =>
      //     import('../examinations/examinations.routes').then(m => m.EXAM_ROUTES),
      // },
      // {
      //   path: 'finance',
      //   loadChildren: () =>
      //     import('../finance/finance.routes').then(m => m.FINANCE_ROUTES),
      // },
      // {
      //   path: 'administration',
      //   canActivate: [roleGuard],
      //   data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
      //   loadChildren: () =>
      //     import('../administration/administration.routes').then(m => m.ADMIN_ROUTES),
      // },
      // {
      //   path: 'administration',
      //   canActivate: [roleGuard],
      //   data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
      //   loadChildren: () =>
      //     import('../administration/administration.routes').then(m => m.ADMIN_ROUTES),
      // },
    ],
  },
];
