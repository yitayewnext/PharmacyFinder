import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, ApprovalStatus, UserRole } from '../../../models/user.model';
import { getApprovalStatusName, getApprovalStatusClass } from '../../../core/utils/approval-status.utils';
import { getRoleName } from '../../../core/utils/role.utils';
import { getRoleEnum } from '../../../core/utils/role.utils';

@Component({
  selector: 'app-user-approval',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-approval-container">
      <div class="header">
        <h1>User Approvals</h1>
        <p>Review and approve user registrations</p>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <p>Loading users...</p>
      </div>

      <div *ngIf="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <div *ngIf="!isLoading && users.length === 0" class="empty-state">
        <p>No pending users to review.</p>
      </div>

      <div *ngIf="!isLoading && users.length > 0" class="users-list">
        <div *ngFor="let user of users" class="user-card card">
          <div class="user-header">
            <div class="user-avatar">{{ getInitials(user) }}</div>
            <div class="user-info">
              <h2>{{ user.firstName }} {{ user.lastName }}</h2>
              <p class="user-email">{{ user.email }}</p>
              <div class="user-meta">
                <span class="role-badge" [ngClass]="'role-' + getRoleName(user.role).toLowerCase().replace(' ', '-')">
                  {{ getRoleName(user.role) }}
                </span>
                <span class="status-badge" [ngClass]="getApprovalStatusClass(user.approvalStatus)">
                  {{ getApprovalStatusName(user.approvalStatus) }}
                </span>
              </div>
            </div>
          </div>

          <div class="user-details">
            <div class="detail-item">
              <span class="detail-label">User ID:</span>
              <span class="detail-value">#{{ user.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email:</span>
              <span class="detail-value">{{ user.email }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Name:</span>
              <span class="detail-value">{{ user.firstName }} {{ user.lastName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Role:</span>
              <span class="detail-value">{{ getRoleName(user.role) }}</span>
            </div>
          </div>

          <div *ngIf="user.approvalStatus === 1" class="user-actions">
            <button
              class="btn btn-danger"
              (click)="updateApproval(user.id, 3)"
              [disabled]="isProcessing"
            >
              Reject
            </button>
            <button
              class="btn btn-success"
              (click)="updateApproval(user.id, 2)"
              [disabled]="isProcessing"
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-approval-container {
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

    .users-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .user-card {
      padding: 2rem;
    }

    .user-header {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .user-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color) 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
    }

    .user-info h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .user-email {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }

    .user-meta {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .role-badge {
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: capitalize;
    }

    .role-customer {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .role-pharmacy-owner {
      background-color: #dcfce7;
      color: #166534;
    }

    .role-admin {
      background-color: #fef3c7;
      color: #92400e;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: capitalize;
    }

    .user-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .detail-item {
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

    .user-actions {
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

    @media (max-width: 768px) {
      .user-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .user-details {
        grid-template-columns: 1fr;
      }

      .user-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class UserApprovalComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);

  users: User[] = [];
  isLoading = false;
  isProcessing = false;
  errorMessage = '';

  ngOnInit(): void {
    // Check if user is admin
    const currentUser = this.authService.getCurrentUser();
    const userRole = currentUser ? getRoleEnum(currentUser.role) : null;
    if (!currentUser || userRole !== UserRole.Admin) {
      this.router.navigate(['/home']);
      return;
    }

    this.loadPendingUsers();
  }

  loadPendingUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getPendingUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to load users.';
        console.error('Error loading users:', error);
      }
    });
  }

  updateApproval(userId: number, status: ApprovalStatus): void {
    this.isProcessing = true;
    this.errorMessage = '';

    this.userService.updateUserApproval(userId, { approvalStatus: status }).subscribe({
      next: () => {
        this.isProcessing = false;
        // Reload the list
        this.loadPendingUsers();
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to update approval status.';
        console.error('Error updating approval:', error);
      }
    });
  }

  getInitials(user: User): string {
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  }

  getApprovalStatusName = getApprovalStatusName;
  getApprovalStatusClass = getApprovalStatusClass;
  getRoleName = getRoleName;
}



