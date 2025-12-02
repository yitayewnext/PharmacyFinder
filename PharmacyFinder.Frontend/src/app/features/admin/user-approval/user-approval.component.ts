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
  templateUrl: './user-approval.component.html',
  styleUrls: ['./user-approval.component.css']
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







