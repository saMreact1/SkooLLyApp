import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError(error => {
      if (error.status === HttpStatusCode.Unauthorized) {
        auth.logout();
      }
      return throwError(() => error);
    })
  );
};
