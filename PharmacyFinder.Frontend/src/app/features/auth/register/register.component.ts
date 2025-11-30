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
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Create Account</h1>
          <p>Join PharmacyFinder today</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div *ngIf="errorMessage" class="alert alert-error">
            {{ errorMessage }}
          </div>

          <div class="form-group">
            <label for="firstName" class="form-label">First Name</label>
            <input
              id="firstName"
              type="text"
              formControlName="firstName"
              class="form-input"
              placeholder="Enter your first name"
              [class.error]="isFieldInvalid('firstName')"
            />
            <div *ngIf="isFieldInvalid('firstName')" class="error-message">
              First name is required
            </div>
          </div>

          <div class="form-group">
            <label for="lastName" class="form-label">Last Name</label>
            <input
              id="lastName"
              type="text"
              formControlName="lastName"
              class="form-input"
              placeholder="Enter your last name"
              [class.error]="isFieldInvalid('lastName')"
            />
            <div *ngIf="isFieldInvalid('lastName')" class="error-message">
              Last name is required
            </div>
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="form-input"
              placeholder="Enter your email"
              [class.error]="isFieldInvalid('email')"
            />
            <div *ngIf="isFieldInvalid('email')" class="error-message">
              <span *ngIf="registerForm.get('email')?.errors?.['required']">Email is required</span>
              <span *ngIf="registerForm.get('email')?.errors?.['email']">Please enter a valid email</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="form-input"
              placeholder="Create a password"
              [class.error]="isFieldInvalid('password')"
            />
            <div *ngIf="isFieldInvalid('password')" class="error-message">
              <span *ngIf="registerForm.get('password')?.errors?.['required']">Password is required</span>
              <span *ngIf="registerForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label for="role" class="form-label">Account Type</label>
            <select
              id="role"
              formControlName="role"
              class="form-select"
              [class.error]="isFieldInvalid('role')"
              (change)="onRoleChange()"
            >
              <option [value]="UserRole.Customer">Customer</option>
              <option [value]="UserRole.PharmacyOwner">Pharmacy Owner</option>
            </select>
            <div *ngIf="isFieldInvalid('role')" class="error-message">
              Please select an account type
            </div>
          </div>

          <div class="form-group" *ngIf="isPharmacyOwner()">
            <label for="licenseNumber" class="form-label">Health Ministry License Number *</label>
            <input
              id="licenseNumber"
              type="text"
              formControlName="licenseNumber"
              class="form-input"
              placeholder="Enter your health ministry license number"
              [class.error]="isFieldInvalid('licenseNumber')"
            />
            <div *ngIf="isFieldInvalid('licenseNumber')" class="error-message">
              License number is required for pharmacy owners
            </div>
            <small class="form-hint">This license must be approved by the health ministry</small>
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="registerForm.invalid || isLoading"
            style="width: 100%; margin-top: 0.5rem;"
          >
            <span *ngIf="isLoading" class="loading"></span>
            <span *ngIf="!isLoading">Create Account</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/login" class="link">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .auth-card {
      width: 100%;
      max-width: 480px;
      background: white;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      padding: 2.5rem;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .auth-header p {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .auth-form {
      margin-bottom: 1.5rem;
    }

    .form-input.error,
    .form-select.error {
      border-color: var(--danger-color);
    }

    .auth-footer {
      text-align: center;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .auth-footer p {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .link {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
    }

    .link:hover {
      text-decoration: underline;
    }

    .form-hint {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-style: italic;
    }
  `]
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
      this.router.navigate(['/home']);
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
        this.router.navigate(['/home']);
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

