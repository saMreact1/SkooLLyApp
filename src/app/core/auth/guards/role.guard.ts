import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { TokenService } from '../services/token.service';
import { UserRole } from '../models/auth.model';

// Usage: canActivate: [roleGuard]
// Route data:  data: { roles: ['ADMIN', 'SUPER_ADMIN'] }
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const tokens = inject(TokenService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as UserRole[];
  const userRole = tokens.currentRole();

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // Logged in but wrong role — send to their own dashboard, not login
  return router.createUrlTree(['/unauthorized']);
};
