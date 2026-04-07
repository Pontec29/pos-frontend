import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { map } from 'rxjs';

export const publicGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.getSession().pipe(
        map(session => {
            if (session && session.token) {
                // If user is logged in, redirect to dashboard
                router.navigate(['/dashboard']);
                return false;
            }
            // If user is not logged in, allow access to public route
            return true;
        })
    );
};
