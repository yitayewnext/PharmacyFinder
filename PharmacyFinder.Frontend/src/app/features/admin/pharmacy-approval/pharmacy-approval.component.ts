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
  template: `
    <div class="pharmacy-approval-container">
      <div class="header">
        <h1>Pharmacy Approvals</h1>
        <p>Review and approve pharmacy registrations</p>
        <div class="filter-controls">
          <button 
            class="filter-btn" 
            [class.active]="showOnlyPending"
            (click)="toggleFilter()"
          >
            {{ showOnlyPending ? 'Show All' : 'Show Pending Only' }}
          </button>
        </div>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <p>Loading pharmacies...</p>
      </div>

      <div *ngIf="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <div *ngIf="!isLoading && filteredPharmacies.length === 0" class="empty-state">
        <p>{{ showOnlyPending ? 'No pending pharmacies to review.' : 'No pharmacies found.' }}</p>
      </div>

      <div *ngIf="!isLoading && filteredPharmacies.length > 0" class="pharmacies-list">
        <div *ngFor="let pharmacy of filteredPharmacies" class="pharmacy-card card">
          <div class="pharmacy-header">
            <div>
              <h2>{{ pharmacy.name }}</h2>
              <p class="pharmacy-owner">Owner: {{ pharmacy.ownerName || 'N/A' }}</p>
            </div>
            <div class="status-badge" [ngClass]="getApprovalStatusClass(pharmacy.approvalStatus)">
              {{ getApprovalStatusName(pharmacy.approvalStatus) }}
            </div>
          </div>

          <div class="pharmacy-details">
            <div class="detail-section">
              <h3>Contact Information</h3>
              <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ pharmacy.email }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">{{ pharmacy.phoneNumber }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">License Number:</span>
                <span class="detail-value">{{ pharmacy.licenseNumber }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Address</h3>
              <div class="detail-item">
                <span class="detail-value">
                  {{ pharmacy.address }}, {{ pharmacy.city }}, {{ pharmacy.state }} {{ pharmacy.zipCode }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Coordinates:</span>
                <span class="detail-value">{{ pharmacy.latitude }}, {{ pharmacy.longitude }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Operating Hours</h3>
              <div class="operating-hours-display">
                <div *ngFor="let day of getDays()" class="day-hours-display">
                  <span class="day-name">{{ day.name }}:</span>
                  <span class="day-hours">
                    <ng-container *ngIf="getDayHours(pharmacy, day.key); let dayHours">
                      <span *ngIf="dayHours.isOpen">
                        {{ dayHours.openTime }} - {{ dayHours.closeTime }}
                      </span>
                      <span *ngIf="!dayHours.isOpen" class="closed">Closed</span>
                    </ng-container>
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-item">
                <span class="detail-label">Registered:</span>
                <span class="detail-value">{{ formatDate(pharmacy.createdAt) }}</span>
              </div>
            </div>
          </div>

          <div *ngIf="isPending(pharmacy.approvalStatus)" class="pharmacy-actions">
            <button
              class="btn btn-danger"
              (click)="updateApproval(pharmacy.id, 3)"
              [disabled]="isProcessing"
            >
              Reject
            </button>
            <button
              class="btn btn-success"
              (click)="updateApproval(pharmacy.id, 2)"
              [disabled]="isProcessing"
            >
              Approve
            </button>
          </div>
          
          <div *ngIf="!isPending(pharmacy.approvalStatus)" class="pharmacy-status-info">
            <p class="status-message">
              This pharmacy has been 
              <span [ngClass]="getApprovalStatusClass(pharmacy.approvalStatus)" class="status-text">
                {{ getApprovalStatusName(pharmacy.approvalStatus) }}
              </span>
              <span *ngIf="pharmacy.approvedAt"> on {{ formatDate(pharmacy.approvedAt) }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pharmacy-approval-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
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

    .filter-controls {
      margin-top: 1rem;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
      color: var(--text-primary);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .filter-btn:hover {
      background: var(--bg-secondary);
      border-color: var(--primary-color);
    }

    .filter-btn.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .loading-container {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
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

    .pharmacies-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .pharmacy-card {
      padding: 2rem;
    }

    .pharmacy-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .pharmacy-header h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .pharmacy-owner {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: capitalize;
    }

    .pharmacy-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 1.5rem;
    }

    .detail-section h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 1rem;
    }

    .detail-item {
      margin-bottom: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      font-weight: 500;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .detail-value {
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .operating-hours-display {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .day-hours-display {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .day-name {
      font-weight: 500;
      color: var(--text-secondary);
      min-width: 100px;
    }

    .day-hours {
      color: var(--text-primary);
    }

    .day-hours .closed {
      color: var(--text-secondary);
      font-style: italic;
    }

    .pharmacy-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-success {
      background-color: #10b981;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background-color: #059669;
    }

    .btn-danger {
      background-color: #ef4444;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background-color: #dc2626;
    }

    .pharmacy-status-info {
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      text-align: center;
    }

    .status-message {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .status-text {
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      margin: 0 0.25rem;
    }

    .approval-status-approved {
      background-color: #dcfce7;
      color: #166534;
    }

    .approval-status-rejected {
      background-color: #fee2e2;
      color: #991b1b;
    }

    @media (max-width: 768px) {
      .pharmacy-header {
        flex-direction: column;
        gap: 1rem;
      }

      .pharmacy-details {
        grid-template-columns: 1fr;
      }

      .pharmacy-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `]
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

