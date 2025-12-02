import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { AuthService } from '../../../core/services/auth.service';
import { Pharmacy } from '../../../models/pharmacy.model';
import { getApprovalStatusName, getApprovalStatusClass } from '../../../core/utils/approval-status.utils';
import { ApprovalStatus, UserRole } from '../../../models/user.model';
import { getRoleEnum } from '../../../core/utils/role.utils';

@Component({
  selector: 'app-pharmacy-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pharmacy-approval.component.html',
  styleUrls: ['./pharmacy-approval.component.css']
})
export class PharmacyApprovalComponent implements OnInit {
  private pharmacyService = inject(PharmacyService);
  private authService = inject(AuthService);
  private router = inject(Router);

  pharmacies: Pharmacy[] = [];
  filteredPharmacies: Pharmacy[] = [];
  isLoading = false;
  isProcessing = false;
  errorMessage = '';
  successMessage = '';
  showOnlyPending = true;

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
      // Redirect if not admin
      this.router.navigate(['/home']);
      return;
    }

    this.loadPharmacies();
  }

  loadPharmacies(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const loadObservable = this.showOnlyPending 
      ? this.pharmacyService.getPendingPharmacies()
      : this.pharmacyService.getAllPharmacies();

    loadObservable.subscribe({
      next: (pharmacies) => {
        this.pharmacies = pharmacies;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to load pharmacies.';
        console.error('Error loading pharmacies:', error);
      }
    });
  }

  toggleFilter(): void {
    this.showOnlyPending = !this.showOnlyPending;
    this.loadPharmacies();
  }

  applyFilter(): void {
    if (this.showOnlyPending) {
      this.filteredPharmacies = this.pharmacies.filter(p => this.isPending(p.approvalStatus));
    } else {
      this.filteredPharmacies = this.pharmacies;
    }
  }

  updateApproval(pharmacyId: number, status: ApprovalStatus): void {
    if (!confirm(`Are you sure you want to ${status === 2 ? 'approve' : 'reject'} this pharmacy?`)) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    const pharmacy = this.pharmacies.find(p => p.id === pharmacyId);
    const pharmacyName = pharmacy?.name || 'Pharmacy';

    this.pharmacyService.updatePharmacyApproval(pharmacyId, { approvalStatus: status }).subscribe({
      next: () => {
        this.isProcessing = false;
        this.successMessage = `Pharmacy "${pharmacyName}" has been ${status === 2 ? 'approved' : 'rejected'} successfully.`;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
        
        // Reload the list
        this.loadPharmacies();
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to update approval status.';
        console.error('Error updating approval:', error);
      }
    });
  }

  getDays() {
    return this.days;
  }

  getDayHours(pharmacy: Pharmacy, dayKey: string) {
    return pharmacy.operatingHours[dayKey as keyof typeof pharmacy.operatingHours];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isPending(status: ApprovalStatus | number | string): boolean {
    if (typeof status === 'number') {
      return status === 1; // ApprovalStatus.Pending
    }
    if (typeof status === 'string') {
      return status.toLowerCase() === 'pending' || status === '1';
    }
    return status === ApprovalStatus.Pending;
  }

  getApprovalStatusName = getApprovalStatusName;
  getApprovalStatusClass = getApprovalStatusClass;
}

