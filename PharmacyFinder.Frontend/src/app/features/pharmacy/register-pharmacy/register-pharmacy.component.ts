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
  templateUrl: './register-pharmacy.component.html',
  styleUrls: ['./register-pharmacy.component.css']
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

