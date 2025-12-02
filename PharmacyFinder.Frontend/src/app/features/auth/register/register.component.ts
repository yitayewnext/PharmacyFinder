import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole, RegisterRequest } from '../../../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  UserRole = UserRole;

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: [UserRole.Customer, [Validators.required]],
      licenseNumber: ['']
    });

    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  isPharmacyOwner(): boolean {
    const roleValue = this.registerForm.get('role')?.value;
    // Handle both number and string comparisons (HTML select might return string)
    return roleValue === UserRole.PharmacyOwner ||
      roleValue === UserRole.PharmacyOwner.toString() ||
      Number(roleValue) === UserRole.PharmacyOwner;
  }

  onRoleChange(): void {
    // Ensure role value is a number (HTML select might return string)
    const roleControl = this.registerForm.get('role');
    const roleValue = roleControl?.value;
    if (typeof roleValue === 'string') {
      roleControl?.setValue(Number(roleValue), { emitEvent: false });
    }

    const licenseControl = this.registerForm.get('licenseNumber');
    if (this.isPharmacyOwner()) {
      licenseControl?.setValidators([Validators.required]);
    } else {
      licenseControl?.clearValidators();
      licenseControl?.setValue('');
    }
    licenseControl?.updateValueAndValidity();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.registerForm.value;
    const data: RegisterRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      password: formValue.password,
      role: formValue.role,
      licenseNumber: formValue.role === UserRole.PharmacyOwner ? formValue.licenseNumber : undefined
    };

    this.authService.register(data).subscribe({
      next: () => {
        console.log('Registration successful - preparing redirect to login');
        this.isLoading = false;
        
        // Ensure we're definitely logged out before navigating
        this.authService.logout();
        
        // Navigate to login page after successful registration
        // Use replaceUrl to prevent back navigation to registration page
        console.log('Navigating to login page...');
        this.router.navigate(['/login'], { 
          replaceUrl: true,
          queryParams: { registered: 'true' }
        }).then(
          (success) => {
            console.log('Navigation successful:', success);
          },
          (error) => {
            console.error('Navigation failed:', error);
            // Fallback: try direct navigation
            window.location.href = '/login?registered=true';
          }
        );
      },
      error: (error) => {
        this.isLoading = false;
        // Backend returns { error: "message" } format
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Registration failed. Please try again.';
        console.error('Registration error:', error);
      }
    });
  }
}

