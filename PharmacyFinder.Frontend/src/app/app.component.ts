import { Component, OnInit, inject, HostListener } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { User, UserRole } from './models/user.model';
import { getRoleName, getRoleEnum } from './core/utils/role.utils';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="app-container">
      <nav class="navbar" *ngIf="isAuthenticated">
        <div class="nav-container">
          <div class="nav-brand">
            <h1>🏥 PharmacyFinder</h1>
          </div>
          <button class="mobile-menu-toggle" (click)="toggleMobileMenu()" [attr.aria-expanded]="isMobileMenuOpen" aria-label="Toggle navigation menu">
            <span class="hamburger-icon">
              <span class="hamburger-line" [class.open]="isMobileMenuOpen"></span>
              <span class="hamburger-line" [class.open]="isMobileMenuOpen"></span>
              <span class="hamburger-line" [class.open]="isMobileMenuOpen"></span>
            </span>
          </button>
          <div class="nav-menu" [class.mobile-open]="isMobileMenuOpen">
            <a routerLink="/home" class="nav-link" [class.active]="currentRoute === '/home'" (click)="closeMobileMenu()">
              Home
            </a>
            <a 
              *ngIf="isPharmacyOwner()" 
              routerLink="/pharmacy/register" 
              class="nav-link" 
              [class.active]="currentRoute === '/pharmacy/register'"
              (click)="closeMobileMenu()"
            >
              Register Pharmacy
            </a>
            <a 
              *ngIf="isAdmin()" 
              routerLink="/admin/pharmacy-approval" 
              class="nav-link" 
              [class.active]="currentRoute === '/admin/pharmacy-approval'"
              (click)="closeMobileMenu()"
            >
              Pharmacy Approvals
            </a>
            <a 
              *ngIf="isAdmin()" 
              routerLink="/admin/user-approval" 
              class="nav-link" 
              [class.active]="currentRoute === '/admin/user-approval'"
              (click)="closeMobileMenu()"
            >
              User Approvals
            </a>
            <a 
              *ngIf="isAdmin()" 
              routerLink="/admin/pharmacy-management" 
              class="nav-link" 
              [class.active]="currentRoute === '/admin/pharmacy-management'"
              (click)="closeMobileMenu()"
            >
              Manage Pharmacies
            </a>
            <a 
              *ngIf="isAdmin()" 
              routerLink="/admin/user-management" 
              class="nav-link" 
              [class.active]="currentRoute === '/admin/user-management'"
              (click)="closeMobileMenu()"
            >
              Manage Users
            </a>
            <div class="profile-menu" (click)="toggleProfileMenu($event)">
              <button class="profile-icon" [attr.aria-expanded]="isProfileMenuOpen" aria-label="User profile menu">
                <span class="profile-avatar">{{ getInitials() }}</span>
              </button>
              <div class="profile-dropdown" *ngIf="isProfileMenuOpen">
                <div class="profile-header">
                  <div class="profile-avatar-large">{{ getInitials() }}</div>
                  <div class="profile-info">
                    <div class="profile-name">{{ currentUser?.firstName }} {{ currentUser?.lastName }}</div>
                    <div class="profile-email">{{ currentUser?.email }}</div>
                    <div class="profile-role">{{ getRoleName(currentUser?.role) }}</div>
                  </div>
                </div>
                <div class="profile-divider"></div>
                <button class="profile-menu-item" (click)="logout()">
                  <span class="menu-icon">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main class="main-content" [class.with-navbar]="isAuthenticated">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .navbar {
      background-color: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-brand h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
      margin: 0;
    }

    .nav-menu {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .mobile-menu-toggle {
      display: none;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 0.25rem;
      z-index: 101;
    }

    .hamburger-icon {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 24px;
      height: 18px;
    }

    .hamburger-line {
      width: 100%;
      height: 3px;
      background-color: var(--text-primary);
      border-radius: 2px;
      transition: all 0.3s ease;
    }

    .hamburger-line.open:nth-child(1) {
      transform: rotate(45deg) translate(6px, 6px);
    }

    .hamburger-line.open:nth-child(2) {
      opacity: 0;
    }

    .hamburger-line.open:nth-child(3) {
      transform: rotate(-45deg) translate(6px, -6px);
    }

    .nav-link {
      text-decoration: none;
      color: var(--text-secondary);
      font-weight: 500;
      padding: 0.5rem 0;
      transition: color 0.2s ease;
      border-bottom: 2px solid transparent;
    }

    .nav-link:hover {
      color: var(--primary-color);
    }

    .nav-link.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }

    .profile-menu {
      position: relative;
    }

    .profile-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .profile-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color) 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .profile-icon:hover .profile-avatar {
      transform: scale(1.05);
      box-shadow: var(--shadow-md);
    }

    .profile-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      background: white;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      min-width: 280px;
      z-index: 1000;
      overflow: hidden;
      animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .profile-header {
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .profile-avatar-large {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color) 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .profile-info {
      flex: 1;
      min-width: 0;
    }

    .profile-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 1rem;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .profile-email {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .profile-role {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: capitalize;
      padding: 0.25rem 0.5rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      display: inline-block;
    }

    .profile-divider {
      height: 1px;
      background: var(--border-color);
      margin: 0.5rem 0;
    }

    .profile-menu-item {
      width: 100%;
      padding: 0.75rem 1.25rem;
      background: none;
      border: none;
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-primary);
      font-size: 0.875rem;
      transition: background-color 0.2s ease;
    }

    .profile-menu-item:hover {
      background-color: var(--bg-secondary);
    }

    .menu-icon {
      font-size: 1rem;
    }

    .main-content {
      flex: 1;
      padding: 2rem 1rem;
    }

    .main-content.with-navbar {
      padding-top: 2rem;
    }

    @media (max-width: 768px) {
      .nav-container {
        position: relative;
      }

      .mobile-menu-toggle {
        display: flex;
      }

      .nav-menu {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 4rem 1.5rem 1.5rem;
        gap: 0;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        z-index: 100;
        overflow-y: auto;
        box-shadow: var(--shadow-lg);
      }

      .nav-menu.mobile-open {
        transform: translateX(0);
      }

      .nav-link {
        width: 100%;
        padding: 1rem 0;
        border-bottom: 1px solid var(--border-color);
        border-bottom-width: 2px;
        font-size: 1rem;
      }

      .nav-link:last-of-type {
        border-bottom: none;
      }

      .profile-menu {
        width: 100%;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 2px solid var(--border-color);
      }

      .profile-icon {
        width: 100%;
        justify-content: flex-start;
      }

      .profile-avatar {
        width: 48px;
        height: 48px;
        font-size: 1rem;
      }

      .profile-dropdown {
        position: static;
        width: 100%;
        min-width: auto;
        margin-top: 1rem;
        box-shadow: none;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
      }

      .nav-brand h1 {
        font-size: 1.25rem;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  currentUser: User | null = null;
  isAuthenticated = false;
  currentRoute = '';
  isProfileMenuOpen = false;
  isMobileMenuOpen = false;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = this.authService.isAuthenticated();
    });

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-menu')) {
      this.isProfileMenuOpen = false;
    }
    if (!target.closest('.nav-container') && !target.closest('.mobile-menu-toggle')) {
      this.isMobileMenuOpen = false;
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  getInitials(): string {
    if (!this.currentUser) return '?';
    const first = this.currentUser.firstName?.charAt(0) || '';
    const last = this.currentUser.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
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

  logout(): void {
    this.isProfileMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getRoleName = getRoleName;
}

