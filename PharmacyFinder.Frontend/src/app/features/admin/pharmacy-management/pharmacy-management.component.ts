import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { AuthService } from '../../../core/services/auth.service';
import { Pharmacy, OperatingHours, DayHours, RegisterPharmacyRequest } from '../../../models/pharmacy.model';
import { ApprovalStatus, UserRole, ApprovalStatusValue } from '../../../models/user.model';
import { getApprovalStatusName, getApprovalStatusClass, getApprovalStatusEnum } from '../../../core/utils/approval-status.utils';
import { getRoleEnum } from '../../../core/utils/role.utils';


@Component({
  selector: 'app-pharmacy-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './pharmacy-management.component.html',
  styleUrls: ['./pharmacy-management.component.css']
})
export class PharmacyManagementComponent implements OnInit {
  private pharmacyService = inject(PharmacyService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  allPharmacies: Pharmacy[] = [];
  filteredPharmacies: Pharmacy[] = [];
  selectedPharmacy: Pharmacy | null = null;
  isLoading = false;
  isProcessing = false;
  isEditing = false;
  errorMessage = '';
  successMessage = '';
  searchQuery = '';
  statusFilter = 'all';

  editForm!: FormGroup;

  ApprovalStatus = ApprovalStatus;

  days = [
    { key: 'monday', name: 'Monday' },
    { key: 'tuesday', name: 'Tuesday' },
    { key: 'wednesday', name: 'Wednesday' },
    { key: 'thursday', name: 'Thursday' },
    { key: 'friday', name: 'Friday' },
    { key: 'saturday', name: 'Saturday' },
    { key: 'sunday', name: 'Sunday' }
  ];

  ngOnInit(): void {
    // Check if user is admin
    const currentUser = this.authService.getCurrentUser();
    const userRole = currentUser ? getRoleEnum(currentUser.role) : null;
    if (!currentUser || userRole !== UserRole.Admin) {
      this.router.navigate(['/home']);
      return;
    }

    // Check for query parameters to set initial filter
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.statusFilter = params['status'];
      }
      this.initializeForm();
      this.loadPharmacies();
    });
  }

  initializeForm(): void {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      licenseNumber: ['', Validators.required],
      businessLicense: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      latitude: [0, Validators.required],
      longitude: [0, Validators.required]
    });
  }

  loadPharmacies(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.pharmacyService.getAllPharmacies().subscribe({
      next: (pharmacies) => {
        this.allPharmacies = pharmacies;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to load pharmacies.';
        console.error('Error loading pharmacies:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allPharmacies];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query) ||
        p.state.toLowerCase().includes(query) ||
        p.licenseNumber.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      const status = parseInt(this.statusFilter);
      filtered = filtered.filter(p => {
        const approvalStatus = p.approvalStatus;
        if (typeof approvalStatus === 'number') {
          return approvalStatus === status;
        }
        if (typeof approvalStatus === 'string') {
          const statusMap: { [key: string]: number } = {
            'pending': 1,
            'approved': 2,
            'rejected': 3
          };
          return statusMap[approvalStatus.toLowerCase()] === status;
        }
        return false;
      });
    }

    this.filteredPharmacies = filtered;
  }

  getCountByStatus(status: number): number {
    return this.allPharmacies.filter(p => {
      const approvalStatus = p.approvalStatus;
      if (typeof approvalStatus === 'number') {
        return approvalStatus === status;
      }
      if (typeof approvalStatus === 'string') {
        const statusMap: { [key: string]: number } = {
          'pending': 1,
          'approved': 2,
          'rejected': 3
        };
        return statusMap[approvalStatus.toLowerCase()] === status;
      }
      return false;
    }).length;
  }

  viewPharmacy(pharmacy: Pharmacy): void {
    this.selectedPharmacy = pharmacy;
    this.isEditing = false;
  }

  editPharmacy(pharmacy: Pharmacy): void {
    this.selectedPharmacy = pharmacy;
    this.isEditing = true;
    this.editForm.patchValue({
      name: pharmacy.name,
      licenseNumber: pharmacy.licenseNumber,
      businessLicense: pharmacy.businessLicense,
      email: pharmacy.email,
      phoneNumber: pharmacy.phoneNumber,
      address: pharmacy.address,
      city: pharmacy.city,
      state: pharmacy.state,
      zipCode: pharmacy.zipCode,
      latitude: pharmacy.latitude,
      longitude: pharmacy.longitude
    });
  }

  savePharmacy(): void {
    if (this.editForm.invalid || !this.selectedPharmacy) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.editForm.value;
    const request: RegisterPharmacyRequest = {
      name: formValue.name,
      licenseNumber: formValue.licenseNumber,
      businessLicense: formValue.businessLicense,
      email: formValue.email,
      phoneNumber: formValue.phoneNumber,
      address: formValue.address,
      city: formValue.city,
      state: formValue.state,
      zipCode: formValue.zipCode,
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      operatingHours: this.selectedPharmacy.operatingHours
    };

    this.pharmacyService.updatePharmacy(this.selectedPharmacy.id, request).subscribe({
      next: () => {
        this.isProcessing = false;
        this.successMessage = 'Pharmacy updated successfully!';
        setTimeout(() => {
          this.closeModal();
          this.loadPharmacies();
        }, 1500);
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to update pharmacy.';
      }
    });
  }

  isPending(status: ApprovalStatusValue | undefined | null): boolean {
    const approvalStatusEnum = getApprovalStatusEnum(status);
    return approvalStatusEnum === ApprovalStatus.Pending;
  }

  isApproved(status: ApprovalStatusValue | undefined | null): boolean {
    const approvalStatusEnum = getApprovalStatusEnum(status);
    return approvalStatusEnum === ApprovalStatus.Approved;
  }

  isRejected(status: ApprovalStatusValue | undefined | null): boolean {
    const approvalStatusEnum = getApprovalStatusEnum(status);
    return approvalStatusEnum === ApprovalStatus.Rejected;
  }

  updateApproval(pharmacyId: number, status: ApprovalStatus): void {
    const pharmacy = this.allPharmacies.find(p => p.id === pharmacyId);
    const isDisapproving = pharmacy && this.isApproved(pharmacy.approvalStatus) && status === ApprovalStatus.Rejected;
    const isApprovingRejected = pharmacy && this.isRejected(pharmacy.approvalStatus) && status === ApprovalStatus.Approved;
    const action = status === ApprovalStatus.Approved 
      ? (isApprovingRejected ? 'approve this rejected pharmacy' : 'approve')
      : (isDisapproving ? 'disapprove' : 'reject');
    
    if (!confirm(`Are you sure you want to ${action}?`)) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.pharmacyService.updatePharmacyApproval(pharmacyId, { approvalStatus: status }).subscribe({
      next: () => {
        this.isProcessing = false;
        const pharmacy = this.allPharmacies.find(p => p.id === pharmacyId);
        const wasApproved = pharmacy && this.isApproved(pharmacy.approvalStatus);
        const wasRejected = pharmacy && this.isRejected(pharmacy.approvalStatus);
        const isDisapproving = wasApproved && status === ApprovalStatus.Rejected;
        const isApprovingRejected = wasRejected && status === ApprovalStatus.Approved;
        let message = '';
        if (status === ApprovalStatus.Approved) {
          message = isApprovingRejected ? 'approved (was rejected)' : 'approved';
        } else {
          message = isDisapproving ? 'disapproved' : 'rejected';
        }
        this.successMessage = `Pharmacy ${message} successfully!`;
        this.loadPharmacies();
        this.closeModal();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to update approval status.';
        console.error('Error updating approval:', error);
      }
    });
  }

  deletePharmacy(pharmacyId: number, pharmacyName: string): void {
    if (!confirm(`Are you sure you want to delete "${pharmacyName}"? This action cannot be undone.`)) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.pharmacyService.deletePharmacy(pharmacyId).subscribe({
      next: () => {
        this.isProcessing = false;
        this.successMessage = 'Pharmacy deleted successfully!';
        setTimeout(() => {
          this.successMessage = '';
          this.loadPharmacies();
        }, 2000);
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to delete pharmacy.';
      }
    });
  }

  closeModal(): void {
    this.selectedPharmacy = null;
    this.isEditing = false;
    this.editForm.reset();
  }

  getDays() {
    return this.days;
  }

  getDayHours(pharmacy: Pharmacy, dayKey: string) {
    return pharmacy.operatingHours[dayKey as keyof typeof pharmacy.operatingHours];
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getApprovalStatusName = getApprovalStatusName;
  getApprovalStatusClass = getApprovalStatusClass;
}

