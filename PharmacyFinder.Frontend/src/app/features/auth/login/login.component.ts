import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Check if coming from registration via query params
    const params = this.route.snapshot.queryParams;
    const fromRegistration = params['registered'] === 'true';
    
    console.log('Login component initialized. Query params:', params);
    console.log('From registration:', fromRegistration);
    
    if (fromRegistration) {
      // Show success message
      this.successMessage = 'Registration successful! Please sign in with your credentials.';
      console.log('Showing success message after registration');
      
      // Clear the query params from URL for a cleaner look
      this.router.navigate(['/login'], { replaceUrl: true, queryParams: {} });
      
      // Clear success message after 8 seconds
      setTimeout(() => {
        this.successMessage = '';
      }, 8000);
    }
    
    // Only redirect to home if authenticated AND not coming from registration
    if (this.authService.isAuthenticated() && !fromRegistration) {
      console.log('User is authenticated, redirecting to home');
      this.router.navigate(['/home']);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isDeactivatedAccountError(): boolean {
    return this.errorMessage.toLowerCase().includes('deactivated');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = ''; // Clear success message when attempting to login

    const credentials = this.loginForm.value;
    this.authService.login(credentials).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.isLoading = false;
        this.successMessage = ''; // Clear success message on error
        // Backend returns { error: "message" } format
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Login failed. Please check your credentials.';
        console.error('Login error:', error);
      }
    });
  }
}

