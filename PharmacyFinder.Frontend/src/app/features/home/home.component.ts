import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  template: `
    <!-- Customer Landing Page -->
    <div *ngIf="isCustomer()" class="home-container">
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">Find Your Nearest Pharmacy</h1>
          <p class="hero-subtitle">Search for pharmacies, compare prices, and get the medicines you need</p>
          <div class="search-box">
            <input 
              type="text" 
              class="search-input" 
              placeholder="Search for pharmacies or medicines..."
              [(ngModel)]="searchQuery"
            />
            <button class="btn btn-primary search-btn">
              <span>🔍</span> Search
            </button>
          </div>
        </div>
      </div>

      <div class="features-section">
        <h2 class="section-title">What You Can Do</h2>
        <div class="features-grid">
          <div class="feature-card card">
            <div class="feature-icon">🔍</div>
            <h3>Search Pharmacies</h3>
            <p>Find pharmacies near you with our advanced search</p>
            <button class="btn btn-outline">Explore</button>
          </div>
          <div class="feature-card card">
            <div class="feature-icon">💊</div>
            <h3>Find Medicines</h3>
            <p>Search for specific medicines and compare prices</p>
            <button class="btn btn-outline">Search</button>
          </div>
          <div class="feature-card card">
            <div class="feature-icon">📍</div>
            <h3>Get Directions</h3>
            <p>Get directions to the nearest pharmacy</p>
            <button class="btn btn-outline">Find Route</button>
          </div>
          <div class="feature-card card">
            <div class="feature-icon">⭐</div>
            <h3>Read Reviews</h3>
            <p>See what others say about pharmacies</p>
            <button class="btn btn-outline">View Reviews</button>
          </div>
        </div>
      </div>

      <div class="quick-actions-section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="actions-grid">
          <button class="action-card card">
            <span class="action-icon">🏥</span>
            <span class="action-text">Browse All Pharmacies</span>
            <span class="action-arrow">→</span>
          </button>
          <button class="action-card card">
            <span class="action-icon">💉</span>
            <span class="action-text">Find Vaccines</span>
            <span class="action-arrow">→</span>
          </button>
          <button class="action-card card">
            <span class="action-icon">📋</span>
            <span class="action-text">Prescription Services</span>
            <span class="action-arrow">→</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Pharmacy Owner Landing Page -->
    <div *ngIf="isPharmacyOwner()" class="home-container">
      <div class="welcome-banner card">
        <div class="welcome-content">
          <h1>Welcome back, {{ currentUser?.firstName }}!</h1>
          <p>Manage your pharmacy business from here</p>
        </div>
      </div>

      <!-- Pharmacy Status Card -->
      <div *ngIf="myPharmacy" class="pharmacy-status-card card">
        <div class="status-header">
          <div>
            <h2>{{ myPharmacy.name }}</h2>
            <p class="pharmacy-address">{{ myPharmacy.address }}, {{ myPharmacy.city }}</p>
          </div>
          <div class="status-badge" [ngClass]="getApprovalStatusClass(myPharmacy.approvalStatus)">
            {{ getApprovalStatusName(myPharmacy.approvalStatus) }}
          </div>
        </div>
        <div class="pharmacy-details-grid">
          <div class="detail-item">
            <span class="detail-label">Email</span>
            <span class="detail-value">{{ myPharmacy.email }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Phone</span>
            <span class="detail-value">{{ myPharmacy.phoneNumber }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">License</span>
            <span class="detail-value">{{ myPharmacy.licenseNumber }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Registered</span>
            <span class="detail-value">{{ formatDate(myPharmacy.createdAt) }}</span>
          </div>
        </div>
        <div class="pharmacy-actions">
          <button class="btn btn-primary" routerLink="/pharmacy/register">Edit Pharmacy</button>
          <button class="btn btn-outline">View Details</button>
        </div>
      </div>

      <!-- Register Pharmacy Card (if no pharmacy) -->
      <div *ngIf="!myPharmacy && !isLoadingPharmacy" class="register-prompt-card card">
        <div class="prompt-content">
          <div class="prompt-icon">🏥</div>
          <h2>Register Your Pharmacy</h2>
          <p>Get started by registering your pharmacy business. Once approved, customers will be able to find you.</p>
          <button class="btn btn-primary" routerLink="/pharmacy/register">Register Now</button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-section">
        <h2 class="section-title">Quick Stats</h2>
        <div class="stats-grid">
          <div class="stat-card card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-value">-</div>
              <div class="stat-label">Total Customers</div>
            </div>
          </div>
          <div class="stat-card card">
            <div class="stat-icon">📦</div>
            <div class="stat-content">
              <div class="stat-value">-</div>
              <div class="stat-label">Orders Today</div>
            </div>
          </div>
          <div class="stat-card card">
            <div class="stat-icon">⭐</div>
            <div class="stat-content">
              <div class="stat-value">-</div>
              <div class="stat-label">Average Rating</div>
            </div>
          </div>
          <div class="stat-card card">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <div class="stat-value">-</div>
              <div class="stat-label">Revenue</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions-section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="actions-grid">
          <button class="action-card card" routerLink="/pharmacy/register">
            <span class="action-icon">✏️</span>
            <span class="action-text">Edit Pharmacy Info</span>
            <span class="action-arrow">→</span>
          </button>
          <button class="action-card card">
            <span class="action-icon">📦</span>
            <span class="action-text">Manage Inventory</span>
            <span class="action-arrow">→</span>
          </button>
          <button class="action-card card">
            <span class="action-icon">📊</span>
            <span class="action-text">View Analytics</span>
            <span class="action-arrow">→</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Admin Landing Page -->
    <div *ngIf="isAdmin()" class="home-container">
      <div class="welcome-banner card">
        <div class="welcome-content">
          <h1>Admin Dashboard</h1>
          <p>Manage the PharmacyFinder platform</p>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="stats-section">
        <h2 class="section-title">Platform Overview</h2>
        <div class="stats-grid">
          <div class="stat-card card clickable" (click)="navigateToUserManagement()" title="View all users">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-value">{{ totalUsers }}</div>
              <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-arrow">→</div>
          </div>
          <div class="stat-card card clickable" (click)="navigateToPharmacyManagement()" title="View all pharmacies">
            <div class="stat-icon">🏥</div>
            <div class="stat-content">
              <div class="stat-value">{{ totalPharmacies }}</div>
              <div class="stat-label">Total Pharmacies</div>
            </div>
            <div class="stat-arrow">→</div>
          </div>
          <div class="stat-card card highlight clickable" (click)="navigateToPendingApprovals()" title="View pending approvals">
            <div class="stat-icon">⏳</div>
            <div class="stat-content">
              <div class="stat-value">{{ pendingPharmaciesCount + pendingUsersCount }}</div>
              <div class="stat-label">Pending Approvals</div>
            </div>
            <div class="stat-arrow">→</div>
          </div>
          <div class="stat-card card clickable" (click)="navigateToPharmacyManagement('approved')" title="View approved pharmacies">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-value">{{ approvedPharmaciesCount }}</div>
              <div class="stat-label">Approved Pharmacies</div>
            </div>
            <div class="stat-arrow">→</div>
          </div>
          <div class="stat-card card clickable" (click)="navigateToUserApproval()" title="View pending user approvals">
            <div class="stat-icon">⏳</div>
            <div class="stat-content">
              <div class="stat-value">{{ pendingUsersCount }}</div>
              <div class="stat-label">Pending User Approvals</div>
            </div>
            <div class="stat-arrow">→</div>
          </div>
          <div class="stat-card card clickable" (click)="navigateToUserManagement('approved')" title="View approved users">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-value">{{ approvedUsersCount }}</div>
              <div class="stat-label">Approved Users</div>
            </div>
            <div class="stat-arrow">→</div>
          </div>
        </div>
      </div>

      <!-- Pending Approvals -->
      <div *ngIf="pendingPharmacies.length > 0" class="pending-section">
        <div class="section-header">
          <h2 class="section-title">Pending Pharmacy Approvals</h2>
          <button class="btn btn-primary" routerLink="/admin/pharmacy-approval">View All</button>
        </div>
        <div class="pharmacies-list">
          <div *ngFor="let pharmacy of pendingPharmacies.slice(0, 3)" class="pharmacy-item card clickable" (click)="navigateToPharmacyApproval()">
            <div class="pharmacy-item-header">
              <div>
                <h3>{{ pharmacy.name }}</h3>
                <p>{{ pharmacy.city }}, {{ pharmacy.state }}</p>
              </div>
              <div class="status-badge pending">Pending</div>
            </div>
            <div class="pharmacy-item-details">
              <span>Owner: {{ pharmacy.ownerName }}</span>
              <span>License: {{ pharmacy.licenseNumber }}</span>
            </div>
            <button class="btn btn-primary btn-sm" routerLink="/admin/pharmacy-approval" (click)="$event.stopPropagation()">Review</button>
          </div>
        </div>
      </div>

      <div *ngIf="pendingUsers.length > 0" class="pending-section">
        <div class="section-header">
          <h2 class="section-title">Pending User Approvals</h2>
          <button class="btn btn-primary" routerLink="/admin/user-approval">View All</button>
        </div>
        <div class="users-list">
          <div *ngFor="let user of pendingUsers.slice(0, 3)" class="user-item card clickable" (click)="navigateToUserApproval()">
            <div class="user-item-header">
              <div>
                <h3>{{ user.firstName }} {{ user.lastName }}</h3>
                <p>{{ user.email }}</p>
              </div>
              <div class="status-badge pending">Pending</div>
            </div>
            <div class="user-item-details">
              <span>Role: {{ getRoleName(user.role) }}</span>
            </div>
            <button class="btn btn-primary btn-sm" routerLink="/admin/user-approval" (click)="$event.stopPropagation()">Review</button>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions-section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="actions-grid">
          <button class="action-card card" routerLink="/admin/user-approval">
            <span class="action-icon">👤</span>
            <span class="action-text">Review User Approvals</span>
            <span class="action-arrow">→</span>
          </button>
          <button class="action-card card" routerLink="/admin/pharmacy-approval">
            <span class="action-icon">✅</span>
            <span class="action-text">Review Pharmacy Approvals</span>
            <span class="action-arrow">→</span>
          </button>
          <button class="action-card card" routerLink="/admin/pharmacy-management">
            <span class="action-icon">🏥</span>
            <span class="action-text">Manage Pharmacies</span>
            <span class="action-arrow">→</span>
          </button>
          <button class="action-card card" routerLink="/admin/user-management">
            <span class="action-icon">👥</span>
            <span class="action-text">Manage Users</span>
            <span class="action-arrow">→</span>
          </button>
          <button class="action-card card">
            <span class="action-icon">📊</span>
            <span class="action-text">View Reports</span>
            <span class="action-arrow">→</span>
          </button>
          <button class="action-card card">
            <span class="action-icon">⚙️</span>
            <span class="action-text">System Settings</span>
            <span class="action-arrow">→</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="isLoadingPharmacy" class="loading-container">
      <p>Loading...</p>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    /* Hero Section (Customer) */
    .hero-section {
      background: linear-gradient(135deg, var(--primary-color) 0%, #764ba2 100%);
      border-radius: var(--radius-xl);
      padding: 4rem 2rem;
      margin-bottom: 3rem;
      color: white;
      text-align: center;
    }

    .hero-title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .search-box {
      display: flex;
      max-width: 600px;
      margin: 0 auto;
      gap: 1rem;
    }

    .search-input {
      flex: 1;
      padding: 1rem 1.5rem;
      border: none;
      border-radius: var(--radius-md);
      font-size: 1rem;
    }

    .search-btn {
      padding: 1rem 2rem;
      font-size: 1rem;
    }

    /* Welcome Banner */
    .welcome-banner {
      background: linear-gradient(135deg, var(--primary-color) 0%, #764ba2 100%);
      color: white;
      margin-bottom: 2rem;
    }

    .welcome-content h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .welcome-content p {
      font-size: 1.125rem;
      opacity: 0.9;
    }

    /* Section Titles */
    .section-title {
      font-size: 1.75rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: var(--text-primary);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .feature-card {
      text-align: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .feature-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .feature-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .feature-card p {
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    /* Pharmacy Status Card */
    .pharmacy-status-card {
      margin-bottom: 2rem;
    }

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .status-header h2 {
      font-size: 1.75rem;
      margin-bottom: 0.5rem;
    }

    .pharmacy-address {
      color: var(--text-secondary);
    }

    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: capitalize;
    }

    .status-badge.pending {
      background-color: #fef3c7;
      color: #92400e;
    }

    .pharmacy-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .detail-value {
      font-size: 1rem;
      color: var(--text-primary);
      font-weight: 500;
    }

    .pharmacy-actions {
      display: flex;
      gap: 1rem;
    }

    /* Register Prompt Card */
    .register-prompt-card {
      text-align: center;
      padding: 3rem 2rem;
      margin-bottom: 2rem;
    }

    .prompt-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .prompt-content h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .prompt-content p {
      color: var(--text-secondary);
      margin-bottom: 2rem;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Stats Section */
    .stats-section {
      margin-bottom: 3rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem;
      position: relative;
    }

    .stat-card.clickable {
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .stat-card.clickable:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
      background: var(--bg-secondary);
    }

    .stat-arrow {
      position: absolute;
      top: 1rem;
      right: 1rem;
      font-size: 1.25rem;
      color: var(--text-secondary);
      opacity: 0;
      transition: all 0.2s ease;
    }

    .stat-card.clickable:hover .stat-arrow {
      opacity: 1;
      transform: translateX(4px);
    }

    .stat-card.highlight {
      border: 2px solid var(--primary-color);
    }

    .stat-icon {
      font-size: 2.5rem;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Quick Actions */
    .quick-actions-section {
      margin-bottom: 3rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      text-align: left;
      width: 100%;
    }

    .action-card:hover {
      transform: translateX(4px);
      box-shadow: var(--shadow-lg);
    }

    .action-icon {
      font-size: 2rem;
    }

    .action-text {
      flex: 1;
      font-weight: 500;
      color: var(--text-primary);
    }

    .action-arrow {
      font-size: 1.5rem;
      color: var(--text-secondary);
    }

    /* Pending Section */
    .pending-section {
      margin-bottom: 3rem;
    }

    .pharmacies-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .pharmacy-item {
      padding: 1.5rem;
    }

    .pharmacy-item.clickable,
    .user-item.clickable {
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pharmacy-item.clickable:hover,
    .user-item.clickable:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
      background: var(--bg-secondary);
    }

    .users-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .user-item {
      padding: 1.5rem;
    }

    .user-item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .user-item-header h3 {
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
    }

    .user-item-details {
      display: flex;
      gap: 2rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .pharmacy-item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .pharmacy-item-header h3 {
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
    }

    .pharmacy-item-details {
      display: flex;
      gap: 2rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .loading-container {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .hero-title {
        font-size: 2rem;
      }

      .hero-subtitle {
        font-size: 1rem;
      }

      .search-box {
        flex-direction: column;
      }

      .features-grid,
      .stats-grid,
      .actions-grid {
        grid-template-columns: 1fr;
      }

      .status-header {
        flex-direction: column;
        gap: 1rem;
      }

      .pharmacy-actions {
        flex-direction: column;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private pharmacyService = inject(PharmacyService);
  private userService = inject(UserService);
  private router = inject(Router);

  currentUser: User | null = null;
  myPharmacy: Pharmacy | null = null;
  pendingPharmacies: Pharmacy[] = [];
  pendingUsers: User[] = [];
  isLoadingPharmacy = false;
  searchQuery = '';

  // Stats
  totalUsers = 0;
  totalPharmacies = 0;
  pendingPharmaciesCount = 0;
  pendingUsersCount = 0;
  approvedPharmaciesCount = 0;
  approvedUsersCount = 0;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadUserData();
      }
    });
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
    this.pharmacyService.getMyPharmacy().subscribe({
      next: (pharmacy) => {
        this.myPharmacy = pharmacy;
        this.isLoadingPharmacy = false;
      },
      error: () => {
        this.myPharmacy = null;
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
