import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards/role.guard';

export const COMMUNICATION_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'announcements',
    pathMatch: 'full',
  },
  {
    path: 'announcements',
    canActivate: [roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
    loadComponent: () =>
      import('./pages/announcements/announcements').then(m => m.Announcements),
  },
  {
    path: 'announcements/create',
    canActivate: [roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
    loadComponent: () =>
      import('./pages/announcements/announcement-form/announcement-form').then(m => m.AnnouncementForm),
  },
  {
    path: 'announcements/:id/edit',
    canActivate: [roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
    loadComponent: () =>
      import('./pages/announcements/announcement-form/announcement-form').then(m => m.AnnouncementForm),
  },
  {
    path: 'messaging',
    canActivate: [roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
    loadComponent: () =>
      import('./pages/messaging/messaging').then(m => m.Messaging),
  },
  {
    path: 'broadcasts',
    canActivate: [roleGuard],
    data: { roles: ['SUPER_ADMIN', 'ADMIN'] },
    loadComponent: () =>
      import('./pages/broadcasts/broadcasts').then(m => m.Broadcasts),
  },
];