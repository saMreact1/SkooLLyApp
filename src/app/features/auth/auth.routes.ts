import { Routes } from '@angular/router';
import { guestGuard } from '../../core/auth/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/auth-shell/auth-shell').then(m => m.AuthShell),
    canActivate: [guestGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(m => m.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/register/register').then(m => m.Register),
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword),
      }
    ]
  }
];
