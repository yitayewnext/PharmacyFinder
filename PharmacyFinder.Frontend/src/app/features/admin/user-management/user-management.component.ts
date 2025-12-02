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
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
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
  activeFilter = 'all';

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

        // Active/Inactive filter
        if (this.activeFilter !== 'all') {
          if (this.activeFilter === 'active') {
            // Treat undefined as active for backwards compatibility
            filtered = filtered.filter(u => u.isActive === true || u.isActive === undefined);
          } else if (this.activeFilter === 'inactive') {
            filtered = filtered.filter(u => u.isActive === false);
          }
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

  activateUser(userId: number, userName: string): void {
    if (!confirm(`Are you sure you want to activate "${userName}"?`)) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.activateUser(userId).subscribe({
      next: () => {
        this.isProcessing = false;
        this.successMessage = 'User activated successfully!';
        this.loadUsers();
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to activate user.';
        console.error('Error activating user:', error);
      }
    });
  }

  deactivateUser(userId: number, userName: string): void {
    if (!confirm(`Are you sure you want to deactivate "${userName}"? The user will not be able to access the system.`)) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.deactivateUser(userId).subscribe({
      next: () => {
        this.isProcessing = false;
        this.successMessage = 'User deactivated successfully!';
        this.loadUsers();
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to deactivate user.';
        console.error('Error deactivating user:', error);
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

  getActiveCount(): number {
    // Treat undefined as active for backwards compatibility
    return this.allUsers.filter(u => u.isActive === true || u.isActive === undefined).length;
  }

  getInactiveCount(): number {
    return this.allUsers.filter(u => u.isActive === false).length;
  }

  getApprovalStatusName = getApprovalStatusName;
  getApprovalStatusClass = getApprovalStatusClass;
  getRoleName = getRoleName;
}

