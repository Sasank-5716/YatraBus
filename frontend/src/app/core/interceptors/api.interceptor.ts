import { HttpInterceptorFn } from '@angular/common/http';

/** Adds JSON content type, the admin token (x-token) and cookie credentials to every /api call. */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) return next(req);
  return next(req.clone({
    withCredentials: true,
    setHeaders: { 'Content-Type': 'application/json', 'x-token': sessionStorage.getItem('yb_admin') || '' },
  }));
};
