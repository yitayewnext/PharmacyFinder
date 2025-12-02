import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PharmacyService } from '../../core/services/pharmacy.service';
import { UserService } from '../../core/services/user.service';
import { User, UserRole } from '../../models/user.model';
import { Pharmacy } from '../../models/pharmacy.model';
import { getRoleEnum, getRoleName } from '../../core/utils/role.utils';
import { getApprovalStatusName, getApprovalStatusClass, getApprovalStatusEnum } from '../../core/utils/approval-status.utils';
import { ApprovalStatus } from '../../models/user.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private pharmacyService = inject(PharmacyService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  currentUser: User | null = null;
  myPharmacies: Pharmacy[] = [];
  pendingPharmacies: Pharmacy[] = [];
  pendingUsers: User[] = [];
  isLoadingPharmacy = false;
  searchQuery = '';
  showApprovalPendingMessage = false;

  // Stats
  totalUsers = 0;
  totalPharmacies = 0;
  pendingPharmaciesCount = 0;
  pendingUsersCount = 0;
  approvedPharmaciesCount = 0;
  approvedUsersCount = 0;

  ngOnInit(): void {
    // Check for approval pending query parameter
    this.route.queryParams.subscribe(params => {
      if (params['approvalPending'] === 'true') {
        this.showApprovalPendingMessage = true;
        // Clear the query param after showing the message
        setTimeout(() => {
          this.router.navigate(['/home'], { replaceUrl: true, queryParams: {} });
        }, 100);
      }
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadUserData();
      }
    });
  }

  isPharmacyOwnerApproved(): boolean {
    return this.authService.isPharmacyOwnerApproved();
  }

  loadUserData(): void {
    const userRole = this.currentUser ? getRoleEnum(this.currentUser.role) : null;

    if (userRole === UserRole.PharmacyOwner) {
      this.loadMyPharmacy();
    } else if (userRole === UserRole.Admin) {
      this.loadAdminData();
    }
  }

  loadMyPharmacy(): void {
    this.isLoadingPharmacy = true;
    this.pharmacyService.getMyPharmacies().subscribe({
      next: (pharmacies) => {
        this.myPharmacies = pharmacies;
        this.isLoadingPharmacy = false;
      },
      error: () => {
        this.myPharmacies = [];
        this.isLoadingPharmacy = false;
      }
    });
  }

  loadAdminData(): void {
    this.pharmacyService.getPendingPharmacies().subscribe({
      next: (pharmacies) => {
        this.pendingPharmacies = pharmacies;
        this.pendingPharmaciesCount = pharmacies.length;
      }
    });

    this.pharmacyService.getAllPharmacies().subscribe({
      next: (pharmacies) => {
        this.totalPharmacies = pharmacies.length;
        this.approvedPharmaciesCount = pharmacies.filter(p => {
          const status = getApprovalStatusEnum(p.approvalStatus);
          return status === ApprovalStatus.Approved;
        }).length;
      }
    });

    this.userService.getPendingUsers().subscribe({
      next: (users) => {
        this.pendingUsers = users;
        this.pendingUsersCount = users.length;
      }
    });

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.totalUsers = users.length;
        this.approvedUsersCount = users.filter(u => {
          const status = getApprovalStatusEnum(u.approvalStatus);
          return status === ApprovalStatus.Approved;
        }).length;
      }
    });
  }

  isCustomer(): boolean {
    if (!this.currentUser) return false;
    const role = getRoleEnum(this.currentUser.role);
    return role === UserRole.Customer;
  }

  isPharmacyOwner(): boolean {
    if (!this.currentUser) return false;
    const role = getRoleEnum(this.currentUser.role);
    return role === UserRole.PharmacyOwner;
  }

  isAdmin(): boolean {
    if (!this.currentUser) return false;
    const role = getRoleEnum(this.currentUser.role);
    return role === UserRole.Admin;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  navigateToUserManagement(filter?: string): void {
    if (filter === 'approved') {
      this.router.navigate(['/admin/user-management'], { queryParams: { status: '2' } });
    } else {
      this.router.navigate(['/admin/user-management']);
    }
  }

  navigateToPharmacyManagement(filter?: string): void {
    if (filter === 'approved') {
      this.router.navigate(['/admin/pharmacy-management'], { queryParams: { status: '2' } });
    } else {
      this.router.navigate(['/admin/pharmacy-management']);
    }
  }

  navigateToUserApproval(): void {
    this.router.navigate(['/admin/user-approval']);
  }

  navigateToPendingApprovals(): void {
    // Navigate to pharmacy approvals if there are pending pharmacies, otherwise user approvals
    if (this.pendingPharmaciesCount > 0) {
      this.router.navigate(['/admin/pharmacy-approval']);
    } else if (this.pendingUsersCount > 0) {
      this.router.navigate(['/admin/user-approval']);
    } else {
      this.router.navigate(['/admin/pharmacy-approval']);
    }
  }

  navigateToPharmacyApproval(): void {
    this.router.navigate(['/admin/pharmacy-approval']);
  }

  getApprovalStatusName = getApprovalStatusName;
  getApprovalStatusClass = getApprovalStatusClass;
  getRoleName = getRoleName;
}
