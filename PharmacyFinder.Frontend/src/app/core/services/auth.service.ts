import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User, UserRole, ApprovalStatus } from '../../models/user.model';
import { environment } from '../../../environments/environment';
import { getRoleEnum } from '../utils/role.utils';
import { getApprovalStatusEnum } from '../utils/approval-status.utils';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Check if token is expired on initialization
    const token = this.getToken();
    if (token && this.isTokenExpired()) {
      this.logout();
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/login`, credentials)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }

  register(data: RegisterRequest): Observable<void> {
    // Clear any existing auth state before making the request
    this.logout();
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/register`, data)
      .pipe(
        tap(() => {
          // Explicitly ensure no tokens are stored - clear any auth state again after response
          this.logout();
        }),
        // Convert to void to ignore the response content
        map(() => void 0)
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('expiresAt');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    
    return true;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Checks if the current user is a pharmacy owner
   */
  isPharmacyOwner(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const role = getRoleEnum(user.role);
    return role === UserRole.PharmacyOwner;
  }

  /**
   * Checks if the current pharmacy owner user is approved
   * Returns true if not a pharmacy owner, false if pharmacy owner but not approved
   */
  isPharmacyOwnerApproved(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const role = getRoleEnum(user.role);
    
    // If not a pharmacy owner, return true (no approval needed)
    if (role !== UserRole.PharmacyOwner) {
      return true;
    }

    // Check approval status
    const approvalStatus = getApprovalStatusEnum(user.approvalStatus);
    return approvalStatus === ApprovalStatus.Approved;
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('expiresAt', response.expiresAt);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  private isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('expiresAt');
    if (!expiresAt) return true;
    
    const expiryDate = new Date(expiresAt);
    return new Date() >= expiryDate;
  }
}




