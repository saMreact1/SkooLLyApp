import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../auth/services/token.service';
import {environment} from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenService);
  const token  = tokens.token();

  const isApiRequest = req.url.startsWith(environment.apiUrl);

  // Only attach token to our own API, not to third-party calls
  if (!token || !isApiRequest) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });

  return next(authReq);
};
