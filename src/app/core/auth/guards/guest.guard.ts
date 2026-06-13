import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const tokens = inject(TokenService);
  const auth   = inject(AuthService);

  if (tokens.isLoggedIn()) {
    auth.redirectToDashboard();
    return false;
  }

  return true;
};
