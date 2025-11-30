import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterPharmacyRequest, OperatingHours, DayHours } from '../../../models/pharmacy.model';
import { UserRole } from '../../../models/user.model';
import { getRoleEnum } from '../../../core/utils/role.utils';

@Component({
  selector: 'app-register-pharmacy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="register-pharmacy-container">
      <div class="register-pharmacy-card card">
        <div class="header">
          <h1>Register Your Pharmacy</h1>
          <p>Fill in the details to register your pharmacy business</p>
        </div>

        <form [formGroup]="pharmacyForm" (ngSubmit)="onSubmit()" class="pharmacy-form">
          <div *ngIf="errorMessage" class="alert alert-error">
            {{ errorMessage }}
          </div>

          <div *ngIf="successMessage" class="alert alert-success">
            {{ successMessage }}
          </div>

          <!-- Basic Information -->
          <div class="form-section">
            <h2>Basic Information</h2>
            
            <div class="form-group">
              <label for="name" class="form-label">Pharmacy Name *</label>
              <input
                id="name"
                type="text"
                formControlName="name"
                class="form-input"
                placeholder="Enter pharmacy name"
                [class.error]="isFieldInvalid('name')"
              />
              <div *ngIf="isFieldInvalid('name')" class="error-message">
                Pharmacy name is required
              </div>
            </div>

            <div class="form-group">
              <label for="ownerLicense" class="form-label">Health Ministry License Number</label>
              <input
                id="ownerLicense"
                type="text"
                [value]="getOwnerLicenseNumber()"
                class="form-input"
                readonly
                disabled
                style="background-color: #f5f5f5; cursor: not-allowed;"
              />
              <small class="form-hint">This license is inherited from your pharmacy owner account</small>
            </div>

            <div class="form-group">
              <label for="businessLicense" class="form-label">Pharmacy Shop Business License *</label>
              <input
                id="businessLicense"
                type="text"
                formControlName="businessLicense"
                class="form-input"
                placeholder="Enter pharmacy shop business license number"
                [class.error]="isFieldInvalid('businessLicense')"
              />
              <div *ngIf="isFieldInvalid('businessLicense')" class="error-message">
                Business license number is required
              </div>
              <small class="form-hint">This is the business license for your pharmacy shop</small>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="form-section">
            <h2>Contact Information</h2>
            
            <div class="form-group">
              <label for="email" class="form-label">Email *</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="form-input"
                placeholder="Enter pharmacy email"
                [class.error]="isFieldInvalid('email')"
              />
              <div *ngIf="isFieldInvalid('email')" class="error-message">
                <span *ngIf="pharmacyForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="pharmacyForm.get('email')?.errors?.['email']">Please enter a valid email</span>
              </div>
            </div>

            <div class="form-group">
              <label for="phoneNumber" class="form-label">Phone Number *</label>
              <input
                id="phoneNumber"
                type="tel"
                formControlName="phoneNumber"
                class="form-input"
                placeholder="Enter phone number"
                [class.error]="isFieldInvalid('phoneNumber')"
              />
              <div *ngIf="isFieldInvalid('phoneNumber')" class="error-message">
                Phone number is required
              </div>
            </div>
          </div>

          <!-- Address Information -->
          <div class="form-section">
            <h2>Address Information</h2>
            
            <div class="form-group">
              <label for="address" class="form-label">Street Address *</label>
              <input
                id="address"
                type="text"
                formControlName="address"
                class="form-input"
                placeholder="Enter street address"
                [class.error]="isFieldInvalid('address')"
              />
              <div *ngIf="isFieldInvalid('address')" class="error-message">
                Address is required
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="city" class="form-label">City *</label>
                <input
                  id="city"
                  type="text"
                  formControlName="city"
                  class="form-input"
                  placeholder="Enter city"
                  [class.error]="isFieldInvalid('city')"
                />
                <div *ngIf="isFieldInvalid('city')" class="error-message">
                  City is required
                </div>
              </div>

              <div class="form-group">
                <label for="state" class="form-label">State *</label>
                <input
                  id="state"
                  type="text"
                  formControlName="state"
                  class="form-input"
                  placeholder="Enter state"
                  [class.error]="isFieldInvalid('state')"
                />
                <div *ngIf="isFieldInvalid('state')" class="error-message">
                  State is required
                </div>
              </div>

              <div class="form-group">
                <label for="zipCode" class="form-label">Zip Code *</label>
                <input
                  id="zipCode"
                  type="text"
                  formControlName="zipCode"
                  class="form-input"
                  placeholder="Enter zip code"
                  [class.error]="isFieldInvalid('zipCode')"
                />
                <div *ngIf="isFieldInvalid('zipCode')" class="error-message">
                  Zip code is required
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="latitude" class="form-label">Latitude *</label>
                <input
                  id="latitude"
                  type="number"
                  step="any"
                  formControlName="latitude"
                  class="form-input"
                  placeholder="Enter latitude"
                  [class.error]="isFieldInvalid('latitude')"
                />
                <div *ngIf="isFieldInvalid('latitude')" class="error-message">
                  Latitude is required
                </div>
              </div>

              <div class="form-group">
                <label for="longitude" class="form-label">Longitude *</label>
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  formControlName="longitude"
                  class="form-input"
                  placeholder="Enter longitude"
                  [class.error]="isFieldInvalid('longitude')"
                />
                <div *ngIf="isFieldInvalid('longitude')" class="error-message">
                  Longitude is required
                </div>
              </div>
            </div>

            <div class="form-help">
              <p>💡 Tip: You can get coordinates from Google Maps by right-clicking on a location</p>
            </div>
          </div>

          <!-- Operating Hours -->
          <div class="form-section">
            <h2>Operating Hours</h2>
            <p class="section-description">Set the operating hours for each day of the week</p>
            
            <div class="operating-hours" formGroupName="operatingHours">
              <div *ngFor="let day of days" class="day-hours">
                <div class="day-header">
                  <label class="day-label">
                    <input
                      type="checkbox"
                      [formControlName]="day.key + 'IsOpen'"
                      class="day-checkbox"
                    />
                    <span class="day-name">{{ day.name }}</span>
                  </label>
                </div>
                <div *ngIf="pharmacyForm.get('operatingHours.' + day.key + 'IsOpen')?.value" class="day-times">
                  <input
                    type="time"
                    [formControlName]="day.key + 'OpenTime'"
                    class="time-input"
                    placeholder="Open time"
                  />
                  <span class="time-separator">to</span>
                  <input
                    type="time"
                    [formControlName]="day.key + 'CloseTime'"
                    class="time-input"
                    placeholder="Close time"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="btn btn-outline"
              (click)="goBack()"
              [disabled]="isLoading"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="pharmacyForm.invalid || isLoading"
            >
              <span *ngIf="isLoading" class="loading"></span>
              <span *ngIf="!isLoading">Register Pharmacy</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .register-pharmacy-container {
      min-height: calc(100vh - 80px);
      padding: 2rem 1rem;
      background: var(--bg-secondary, #f5f5f5);
    }

    .register-pharmacy-card {
      max-width: 900px;
      margin: 0 auto;
      padding: 2.5rem;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .header p {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .form-section {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border-color);
    }

    .form-section:last-of-type {
      border-bottom: none;
    }

    .form-section h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 1.5rem;
    }

    .section-description {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      transition: border-color 0.2s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .form-input.error {
      border-color: var(--danger-color);
    }

    .error-message {
      color: var(--danger-color);
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .form-help {
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .operating-hours {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .day-hours {
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
    }

    .day-header {
      margin-bottom: 0.75rem;
    }

    .day-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      color: var(--text-primary);
    }

    .day-checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .day-times {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .time-input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
    }

    .time-separator {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);
    }

    .alert {
      padding: 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
    }

    .alert-error {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .alert-success {
      background-color: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    @media (max-width: 768px) {
      .register-pharmacy-card {
        padding: 1.5rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RegisterPharmacyComponent {
  private fb = inject(FormBuilder);
  private pharmacyService = inject(PharmacyService);
  private authService = inject(AuthService);
  private router = inject(Router);

  pharmacyForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  days = [
    { key: 'monday', name: 'Monday' },
    { key: 'tuesday', name: 'Tuesday' },
    { key: 'wednesday', name: 'Wednesday' },
    { key: 'thursday', name: 'Thursday' },
    { key: 'friday', name: 'Friday' },
    { key: 'saturday', name: 'Saturday' },
    { key: 'sunday', name: 'Sunday' }
  ];

  constructor() {
    // Check if user is a pharmacy owner
    const currentUser = this.authService.getCurrentUser();
    const userRole = currentUser ? getRoleEnum(currentUser.role) : null;
    if (!currentUser || userRole !== UserRole.PharmacyOwner) {
      this.router.navigate(['/home']);
      return;
    }

    this.pharmacyForm = this.fb.group({
      name: ['', [Validators.required]],
      businessLicense: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required]],
      latitude: [0, [Validators.required]],
      longitude: [0, [Validators.required]],
      operatingHours: this.fb.group({
        mondayIsOpen: [false],
        mondayOpenTime: ['09:00'],
        mondayCloseTime: ['17:00'],
        tuesdayIsOpen: [false],
        tuesdayOpenTime: ['09:00'],
        tuesdayCloseTime: ['17:00'],
        wednesdayIsOpen: [false],
        wednesdayOpenTime: ['09:00'],
        wednesdayCloseTime: ['17:00'],
        thursdayIsOpen: [false],
        thursdayOpenTime: ['09:00'],
        thursdayCloseTime: ['17:00'],
        fridayIsOpen: [false],
        fridayOpenTime: ['09:00'],
        fridayCloseTime: ['17:00'],
        saturdayIsOpen: [false],
        saturdayOpenTime: ['09:00'],
        saturdayCloseTime: ['17:00'],
        sundayIsOpen: [false],
        sundayOpenTime: ['09:00'],
        sundayCloseTime: ['17:00']
      })
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.pharmacyForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.pharmacyForm.invalid) {
      this.pharmacyForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.pharmacyForm.value;
    const operatingHours: OperatingHours = {
      monday: {
        isOpen: formValue.operatingHours.mondayIsOpen,
        openTime: formValue.operatingHours.mondayIsOpen ? formValue.operatingHours.mondayOpenTime : undefined,
        closeTime: formValue.operatingHours.mondayIsOpen ? formValue.operatingHours.mondayCloseTime : undefined
      },
      tuesday: {
        isOpen: formValue.operatingHours.tuesdayIsOpen,
        openTime: formValue.operatingHours.tuesdayIsOpen ? formValue.operatingHours.tuesdayOpenTime : undefined,
        closeTime: formValue.operatingHours.tuesdayIsOpen ? formValue.operatingHours.tuesdayCloseTime : undefined
      },
      wednesday: {
        isOpen: formValue.operatingHours.wednesdayIsOpen,
        openTime: formValue.operatingHours.wednesdayIsOpen ? formValue.operatingHours.wednesdayOpenTime : undefined,
        closeTime: formValue.operatingHours.wednesdayIsOpen ? formValue.operatingHours.wednesdayCloseTime : undefined
      },
      thursday: {
        isOpen: formValue.operatingHours.thursdayIsOpen,
        openTime: formValue.operatingHours.thursdayIsOpen ? formValue.operatingHours.thursdayOpenTime : undefined,
        closeTime: formValue.operatingHours.thursdayIsOpen ? formValue.operatingHours.thursdayCloseTime : undefined
      },
      friday: {
        isOpen: formValue.operatingHours.fridayIsOpen,
        openTime: formValue.operatingHours.fridayIsOpen ? formValue.operatingHours.fridayOpenTime : undefined,
        closeTime: formValue.operatingHours.fridayIsOpen ? formValue.operatingHours.fridayCloseTime : undefined
      },
      saturday: {
        isOpen: formValue.operatingHours.saturdayIsOpen,
        openTime: formValue.operatingHours.saturdayIsOpen ? formValue.operatingHours.saturdayOpenTime : undefined,
        closeTime: formValue.operatingHours.saturdayIsOpen ? formValue.operatingHours.saturdayCloseTime : undefined
      },
      sunday: {
        isOpen: formValue.operatingHours.sundayIsOpen,
        openTime: formValue.operatingHours.sundayIsOpen ? formValue.operatingHours.sundayOpenTime : undefined,
        closeTime: formValue.operatingHours.sundayIsOpen ? formValue.operatingHours.sundayCloseTime : undefined
      }
    };

    const request: RegisterPharmacyRequest = {
      name: formValue.name,
      licenseNumber: '', // Will be inherited from owner's account on backend
      businessLicense: formValue.businessLicense,
      email: formValue.email,
      phoneNumber: formValue.phoneNumber,
      address: formValue.address,
      city: formValue.city,
      state: formValue.state,
      zipCode: formValue.zipCode,
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      operatingHours: operatingHours
    };

    this.pharmacyService.registerPharmacy(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Pharmacy registered successfully! It is now pending admin approval.';
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Registration failed. Please try again.';
        console.error('Pharmacy registration error:', error);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  getOwnerLicenseNumber(): string {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.licenseNumber || 'Not available';
  }
}

