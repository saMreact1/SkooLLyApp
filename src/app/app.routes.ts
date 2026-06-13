import { Routes } from '@angular/router';
import {authGuard} from './core/auth/guards/auth.guard';

export const routes: Routes = [
  {path: '', redirectTo: 'auth', pathMatch: 'full'},
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Protected routes (all require auth)
  {
    path: 'app',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
  },
  //
  // { path: 'unauthorized', loadComponent: () =>
  //     import('./shared/components/unauthorized/unauthorized.component')
  //       .then(m => m.UnauthorizedComponent) },
  //
  // { path: '**', redirectTo: 'auth' },
];
