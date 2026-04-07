import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.getSession().pipe(
        map(session => {
            if (session && session.token) {
                return true;
            } else {
                router.navigate(['/login']);
                return false;
            }
        }),
        catchError(() => {
            router.navigate(['/login']);
            return of(false);
        })
    );
};
