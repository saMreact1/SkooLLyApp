import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

// Protects all routes that require a valid session
export const authGuard: CanActivateFn = () => {
  const tokens = inject(TokenService);
  const router = inject(Router);

  if (tokens.isLoggedIn() && !tokens.isTokenExpired()) {
    return true;
  }

  tokens.clear();
  return router.createUrlTree(['/auth/login']);
};
