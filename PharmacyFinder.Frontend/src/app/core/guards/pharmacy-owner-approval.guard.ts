import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard that ensures pharmacy owners are approved before accessing protected routes
 * Redirects to home with a message if not approved
 */
export const pharmacyOwnerApprovalGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check if user is authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // If user is a pharmacy owner, check if they're approved
  if (authService.isPharmacyOwner()) {
    if (!authService.isPharmacyOwnerApproved()) {
      // Redirect to home with a query param to show pending approval message
      router.navigate(['/home'], { 
        queryParams: { 
          approvalPending: 'true',
          returnUrl: state.url 
        } 
      });
      return false;
    }
  }

  // Allow access if user is not a pharmacy owner, or if they are approved
  return true;
};






