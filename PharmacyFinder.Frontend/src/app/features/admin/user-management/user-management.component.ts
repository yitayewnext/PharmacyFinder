import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, ApprovalStatus, UserRole, ApprovalStatusValue, UpdateUserRequest, RegisterRequest } from '../../../models/user.model';
import { getApprovalStatusName, getApprovalStatusClass, getApprovalStatusEnum } from '../../../core/utils/approval-status.utils';
import { getRoleEnum, getRoleName } from '../../../core/utils/role.utils';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="user-management-container">
      <div class="header">
        <div class="header-content">
          <div>
            <h1>User Management</h1>
            <p>View and manage all registered users</p>
          </div>
          <button class="btn btn-primary" (click)="openCreateUserModal()">
            ➕ Create Admin
          </button>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="controls-section card">
        <div class="search-filter">
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search users by name or email..."
            [(ngModel)]="searchQuery"
            (input)="applyFilters()"
          />
          <select 
            class="filter-select" 
            [(ngModel)]="statusFilter"
            (change)="applyFilters()"
          >
            <option value="all">All Statuses</option>
            <option value="1">Pending</option>
            <option value="2">Approved</option>
            <option value="3">Rejected</option>
          </select>
          <select 
            class="filter-select" 
            [(ngModel)]="roleFilter"
            (change)="applyFilters()"
          >
            <option value="all">All Roles</option>
            <option value="1">Customer</option>
            <option value="2">Pharmacy Owner</option>
            <option value="3">Admin</option>
          </select>
        </div>
        <div class="stats-summary">
          <span class="stat-item">Total: {{ allUsers.length }}</span>
          <span class="stat-item">Pending: {{ getCountByStatus(1) }}</span>
          <span class="stat-item">Approved: {{ getCountByStatus(2) }}</span>
          <span class="stat-item">Rejected: {{ getCountByStatus(3) }}</span>
        </div>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <p>Loading users...</p>
      </div>

      <div *ngIf="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <div *ngIf="!isLoading && filteredUsers.length === 0" class="empty-state">
        <p>No users found matching your criteria.</p>
      </div>

      <!-- Users Table -->
      <div *ngIf="!isLoading && filteredUsers.length > 0" class="users-table card">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of filteredUsers">
              <td data-label="Name">
                <div class="user-name-cell">
                  <strong>{{ user.firstName }} {{ user.lastName }}</strong>
                </div>
              </td>
              <td data-label="Email">{{ user.email }}</td>
              <td data-label="Role">
                <span class="role-badge">{{ getRoleName(user.role) }}</span>
              </td>
              <td data-label="Status">
                <span class="status-badge" [ngClass]="getApprovalStatusClass(user.approvalStatus)">
                  {{ getApprovalStatusName(user.approvalStatus) }}
                </span>
              </td>
              <td data-label="Registered">{{ formatDate(user.createdAt || '') }}</td>
              <td data-label="Actions">
                <div class="action-buttons">
                  <button 
                    *ngIf="isPending(user.approvalStatus)"
                    class="btn btn-sm btn-success" 
                    (click)="updateApproval(user.id, ApprovalStatus.Approved)"
                    title="Approve"
                    [disabled]="isProcessing"
                  >
                    ✅ Approve
                  </button>
                  <button 
                    *ngIf="isRejected(user.approvalStatus)"
                    class="btn btn-sm btn-success" 
                    (click)="updateApproval(user.id, ApprovalStatus.Approved)"
                    title="Approve"
                    [disabled]="isProcessing"
                  >
                    ✅ Approve
                  </button>
                  <button 
                    *ngIf="isPending(user.approvalStatus)"
                    class="btn btn-sm btn-danger" 
                    (click)="updateApproval(user.id, ApprovalStatus.Rejected)"
                    title="Reject"
                    [disabled]="isProcessing"
                  >
                    ❌ Reject
                  </button>
                  <button 
                    *ngIf="isApproved(user.approvalStatus)"
                    class="btn btn-sm btn-danger" 
                    (click)="updateApproval(user.id, ApprovalStatus.Rejected)"
                    title="Disapprove"
                    [disabled]="isProcessing"
                  >
                    ❌ Disapprove
                  </button>
                  <button 
                    class="btn btn-sm btn-secondary" 
                    (click)="viewUser(user)"
                    title="View Details"
                  >
                    👁️ View
                  </button>
                  <button 
                    class="btn btn-sm btn-primary" 
                    (click)="editUser(user)"
                    title="Edit User"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    class="btn btn-sm btn-danger" 
                    (click)="deleteUser(user.id, user.firstName + ' ' + user.lastName)"
                    title="Delete User"
                    [disabled]="isProcessing"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- View User Modal -->
      <div *ngIf="selectedUser && !isEditing" class="modal-overlay" (click)="closeModal()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>User Details</h2>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="detail-section">
              <h3>Personal Information</h3>
              <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{ selectedUser.firstName }} {{ selectedUser.lastName }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ selectedUser.email }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Role:</span>
                <span class="detail-value">{{ getRoleName(selectedUser.role) }}</span>
              </div>
              <div class="detail-item" *ngIf="selectedUser.licenseNumber">
                <span class="detail-label">License Number:</span>
                <span class="detail-value">{{ selectedUser.licenseNumber }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Account Status</h3>
              <div class="detail-item">
                <span class="detail-label">Approval Status:</span>
                <span class="status-badge" [ngClass]="getApprovalStatusClass(selectedUser.approvalStatus)">
                  {{ getApprovalStatusName(selectedUser.approvalStatus) }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">User ID:</span>
                <span class="detail-value">{{ selectedUser.id }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Registered:</span>
                <span class="detail-value">{{ formatDate(selectedUser.createdAt || '') }}</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button *ngIf="isPending(selectedUser.approvalStatus)" class="btn btn-success" (click)="updateApproval(selectedUser.id, ApprovalStatus.Approved)" [disabled]="isProcessing">
              Approve User
            </button>
            <button *ngIf="isRejected(selectedUser.approvalStatus)" class="btn btn-success" (click)="updateApproval(selectedUser.id, ApprovalStatus.Approved)" [disabled]="isProcessing">
              Approve User
            </button>
            <button *ngIf="isPending(selectedUser.approvalStatus)" class="btn btn-danger" (click)="updateApproval(selectedUser.id, ApprovalStatus.Rejected)" [disabled]="isProcessing">
              Reject User
            </button>
            <button *ngIf="isApproved(selectedUser.approvalStatus)" class="btn btn-danger" (click)="updateApproval(selectedUser.id, ApprovalStatus.Rejected)" [disabled]="isProcessing">
              Disapprove User
            </button>
            <button class="btn btn-primary" (click)="editUser(selectedUser)">Edit User</button>
            <button class="btn btn-secondary" (click)="closeModal()">Close</button>
          </div>
        </div>
      </div>

      <!-- Create Admin User Modal -->
      <div *ngIf="isCreating" class="modal-overlay" (click)="closeCreateModal()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Create New Admin</h2>
            <button class="close-btn" (click)="closeCreateModal()">×</button>
          </div>

          <div class="modal-body">
            <form [formGroup]="createForm" (ngSubmit)="createUser()">
              <div class="form-section">
                <h3>Admin Information</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="createFirstName" class="form-label">First Name *</label>
                    <input id="createFirstName" type="text" formControlName="firstName" class="form-input" />
                  </div>
                  <div class="form-group">
                    <label for="createLastName" class="form-label">Last Name *</label>
                    <input id="createLastName" type="text" formControlName="lastName" class="form-input" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="createEmail" class="form-label">Email *</label>
                  <input id="createEmail" type="email" formControlName="email" class="form-input" />
                </div>
                <div class="form-group">
                  <label for="createPassword" class="form-label">Password *</label>
                  <input id="createPassword" type="password" formControlName="password" class="form-input" />
                  <small class="form-hint">Password must be at least 6 characters</small>
                </div>
                <div class="form-group">
                  <div class="role-info">
                    <span class="role-badge role-admin">Admin</span>
                    <small class="form-hint">This user will be created with Admin privileges</small>
                  </div>
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="createForm.invalid || isProcessing">Create Admin</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Edit User Modal -->
      <div *ngIf="selectedUser && isEditing" class="modal-overlay" (click)="closeModal()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Edit User: {{ selectedUser.firstName }} {{ selectedUser.lastName }}</h2>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>

          <div class="modal-body">
            <form [formGroup]="editForm" (ngSubmit)="saveUser()">
              <div class="form-section">
                <h3>Personal Information</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="editFirstName" class="form-label">First Name *</label>
                    <input id="editFirstName" type="text" formControlName="firstName" class="form-input" />
                  </div>
                  <div class="form-group">
                    <label for="editLastName" class="form-label">Last Name *</label>
                    <input id="editLastName" type="text" formControlName="lastName" class="form-input" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="editEmail" class="form-label">Email *</label>
                  <input id="editEmail" type="email" formControlName="email" class="form-input" />
                </div>
                <div class="form-group">
                  <label for="editRole" class="form-label">Role *</label>
                  <select id="editRole" formControlName="role" class="form-input">
                    <option [value]="UserRole.Customer">Customer</option>
                    <option [value]="UserRole.PharmacyOwner">Pharmacy Owner</option>
                    <option [value]="UserRole.Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="editForm.invalid || isProcessing">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-management-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .header p {
      color: var(--text-secondary);
      font-size: 1rem;
    }

    .controls-section {
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .search-filter {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1;
      min-width: 250px;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
    }

    .filter-select {
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      background: white;
      min-width: 150px;
    }

    .stats-summary {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .stat-item {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .users-table {
      overflow-x: auto;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table thead {
      background: var(--bg-secondary);
    }

    .table th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .table td {
      padding: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .table tbody tr:hover {
      background: var(--bg-secondary);
    }

    .user-name-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .role-badge {
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: capitalize;
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: capitalize;
      display: inline-block;
    }

    .status-badge.pending {
      background-color: #fef3c7;
      color: #92400e;
    }

    .status-badge.approved {
      background-color: #d1fae5;
      color: #065f46;
    }

    .status-badge.rejected {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #059669;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #dc2626;
    }

    .btn-secondary {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--border-color);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading-container,
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    .alert {
      padding: 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
    }

    .alert-error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .alert-success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: var(--radius-lg);
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 2rem;
      cursor: pointer;
      color: var(--text-secondary);
      line-height: 1;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: var(--text-primary);
    }

    .modal-body {
      padding: 1.5rem;
    }

    .detail-section {
      margin-bottom: 2rem;
    }

    .detail-section:last-child {
      margin-bottom: 0;
    }

    .detail-section h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 1rem;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    .detail-item:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-weight: 500;
      color: var(--text-secondary);
    }

    .detail-value {
      color: var(--text-primary);
      font-weight: 500;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .form-section {
      margin-bottom: 2rem;
    }

    .form-section h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .form-hint {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .role-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .role-badge.role-admin {
      background: #fef3c7;
      color: #92400e;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-weight: 600;
      display: inline-block;
      width: fit-content;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #6366f1;
    }

    @media (max-width: 1024px) {
      .user-management-container {
        padding: 1rem 0.5rem;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .header-content .btn {
        width: 100%;
      }

      .controls-section {
        padding: 1rem;
      }

      .stats-summary {
        flex-direction: column;
        gap: 0.75rem;
      }

      .table {
        display: block;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .table thead {
        display: none;
      }

      .table tbody {
        display: block;
      }

      .table tr {
        display: block;
        margin-bottom: 1rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 1rem;
        background: white;
      }

      .table td {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-top: none;
        border-bottom: 1px solid var(--border-color);
        text-align: right;
      }

      .table td:last-child {
        border-bottom: none;
      }

      .table td::before {
        content: attr(data-label);
        font-weight: 600;
        text-align: left;
        margin-right: 1rem;
        color: var(--text-secondary);
      }

      .action-buttons {
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .btn-sm {
        flex: 1;
        min-width: calc(50% - 0.25rem);
      }

      .modal-content {
        max-width: 95%;
        margin: 1rem;
      }

      .modal-header {
        padding: 1rem;
      }

      .modal-body {
        padding: 1rem;
      }

      .modal-footer {
        padding: 1rem;
        flex-direction: column;
      }

      .modal-footer .btn {
        width: 100%;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .detail-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .detail-label {
        font-size: 0.75rem;
      }
    }

    @media (max-width: 640px) {
      .user-management-container {
        padding: 0.5rem;
      }

      .header h1 {
        font-size: 1.5rem;
      }

      .header p {
        font-size: 0.875rem;
      }

      .search-filter {
        flex-direction: column;
      }

      .search-input,
      .filter-select {
        width: 100%;
      }

      .users-table {
        font-size: 0.75rem;
      }

      .action-buttons {
        flex-direction: column;
      }

      .btn-sm {
        width: 100%;
        min-width: 100%;
      }

      .modal-overlay {
        padding: 0.5rem;
      }

      .modal-content {
        max-width: 100%;
        max-height: 95vh;
      }
    }
  `]
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  allUsers: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  isLoading = false;
  isProcessing = false;
  isEditing = false;
  isCreating = false;
  errorMessage = '';
  successMessage = '';
  searchQuery = '';
  statusFilter = 'all';
  roleFilter = 'all';

  editForm!: FormGroup;
  createForm!: FormGroup;

  ApprovalStatus = ApprovalStatus;
  UserRole = UserRole;

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
      this.initializeForms();
      this.loadUsers();
    });
  }

  initializeForms(): void {
    this.editForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: [UserRole.Customer, [Validators.required]]
    });

    this.createForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: [UserRole.Admin, [Validators.required]] // Always Admin
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        // Apply filters after loading, which will use the statusFilter set from query params
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to load users.';
        console.error('Error loading users:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allUsers];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.firstName.toLowerCase().includes(query) ||
        u.lastName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      const status = parseInt(this.statusFilter);
      filtered = filtered.filter(u => {
        const approvalStatus = u.approvalStatus;
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

    // Role filter
    if (this.roleFilter !== 'all') {
      const role = parseInt(this.roleFilter);
      filtered = filtered.filter(u => {
        const userRole = u.role;
        if (typeof userRole === 'number') {
          return userRole === role;
        }
        if (typeof userRole === 'string') {
          const roleMap: { [key: string]: number } = {
            'customer': 1,
            'pharmacyowner': 2,
            'admin': 3
          };
          return roleMap[userRole.toLowerCase()] === role;
        }
        return false;
      });
    }

    this.filteredUsers = filtered;
  }

  getCountByStatus(status: number): number {
    return this.allUsers.filter(u => {
      const approvalStatus = u.approvalStatus;
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

  viewUser(user: User): void {
    this.selectedUser = user;
    this.isEditing = false;
  }

  editUser(user: User): void {
    this.selectedUser = user;
    this.isEditing = true;
    const userRole = getRoleEnum(user.role);
    this.editForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: userRole !== null ? userRole : UserRole.Customer
    });
  }

  saveUser(): void {
    if (this.editForm.invalid || !this.selectedUser) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.editForm.value;
    const request: UpdateUserRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      role: formValue.role
    };

    this.userService.updateUser(this.selectedUser.id, request).subscribe({
      next: () => {
        this.isProcessing = false;
        this.successMessage = 'User updated successfully!';
        this.loadUsers();
        setTimeout(() => {
          this.closeModal();
          this.successMessage = '';
        }, 1500);
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to update user.';
        console.error('Error updating user:', error);
      }
    });
  }

  deleteUser(userId: number, userName: string): void {
    if (!confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.isProcessing = false;
        this.successMessage = 'User deleted successfully!';
        this.loadUsers();
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to delete user.';
        console.error('Error deleting user:', error);
      }
    });
  }

  openCreateUserModal(): void {
    this.isCreating = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.createForm.reset({
      role: UserRole.Admin // Always Admin
    });
  }

  closeCreateModal(): void {
    this.isCreating = false;
    this.createForm.reset();
  }

  createUser(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.createForm.value;
    const request: RegisterRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      password: formValue.password,
      role: formValue.role
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.isProcessing = false;
        this.successMessage = 'Admin user created successfully!';
        this.loadUsers();
        setTimeout(() => {
          this.closeCreateModal();
          this.successMessage = '';
        }, 1500);
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to create admin user.';
        console.error('Error creating admin user:', error);
      }
    });
  }

  closeModal(): void {
    this.selectedUser = null;
    this.isEditing = false;
    this.editForm.reset();
  }

  updateApproval(userId: number, status: ApprovalStatus): void {
    const user = this.allUsers.find(u => u.id === userId);
    const isDisapproving = user && this.isApproved(user.approvalStatus) && status === ApprovalStatus.Rejected;
    const isApprovingRejected = user && this.isRejected(user.approvalStatus) && status === ApprovalStatus.Approved;
    const action = status === ApprovalStatus.Approved 
      ? (isApprovingRejected ? 'approve this rejected user' : 'approve')
      : (isDisapproving ? 'disapprove' : 'reject');
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.updateUserApproval(userId, { approvalStatus: status }).subscribe({
      next: () => {
        this.isProcessing = false;
        const user = this.allUsers.find(u => u.id === userId);
        const wasApproved = user && this.isApproved(user.approvalStatus);
        const wasRejected = user && this.isRejected(user.approvalStatus);
        const isDisapproving = wasApproved && status === ApprovalStatus.Rejected;
        const isApprovingRejected = wasRejected && status === ApprovalStatus.Approved;
        let message = '';
        if (status === ApprovalStatus.Approved) {
          message = isApprovingRejected ? 'approved (was rejected)' : 'approved';
        } else {
          message = isDisapproving ? 'disapproved' : 'rejected';
        }
        this.successMessage = `User ${message} successfully!`;
        this.loadUsers();
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

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getApprovalStatusName = getApprovalStatusName;
  getApprovalStatusClass = getApprovalStatusClass;
  getRoleName = getRoleName;
}

