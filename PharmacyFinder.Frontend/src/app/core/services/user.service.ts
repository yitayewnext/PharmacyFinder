import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, ApprovalStatus, UpdateUserRequest } from '../../models/user.model';
import { environment } from '../../../environments/environment';

export interface UpdateUserApprovalRequest {
  approvalStatus: ApprovalStatus;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getPendingUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/api/user/pending`);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/api/user/all`);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/user/${id}`);
  }

  updateUserApproval(userId: number, request: UpdateUserApprovalRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/api/user/${userId}/approval`, request);
  }

  updateUser(userId: number, request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/api/user/${userId}`, request);
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/user/${userId}`);
  }
}

