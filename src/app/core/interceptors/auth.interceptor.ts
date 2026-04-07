import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, from } from 'rxjs'; // Use 'from' to convert Promise to Observable if needed
import { AuthService } from '../../features/auth/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Skip token attachment for auth endpoints to avoid circular dependencies or unnecessary checks
    if (req.url.includes('/api/auth/login')) {
        return next(req);
    }

    return authService.getSession().pipe(
        switchMap(session => {
            const headersToSet: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Tenant-ID': '1'
            };

            if (session && session.token) {
                headersToSet['Authorization'] = `Bearer ${session.token}`;
            }

            const request = req.clone({
                setHeaders: headersToSet
            });

            return next(request).pipe(
                catchError((error: HttpErrorResponse) => {
                    if (error.status === 401) {
                        // Token expired or invalid
                        console.warn('Token expired or invalid (401). Redirecting to login...');

                        // We use 'from' because logout returns an Observable.
                        // We catchError inside the switchMap to ensure navigation happens even if DB cleanup fails.
                        return authService.logout().pipe(
                            catchError(err => {
                                console.error('Error during logout cleanup:', err);
                                return from([null]); // Continue despite error
                            }),
                            switchMap(() => {
                                router.navigate(['/login']);
                                return throwError(() => error);
                            })
                        );
                    }
                    return throwError(() => error);
                })
            );
        })
    );
};
