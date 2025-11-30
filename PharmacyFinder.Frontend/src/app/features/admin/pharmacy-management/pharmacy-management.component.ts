import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { AuthService } from '../../../core/services/auth.service';
import { Pharmacy, OperatingHours, DayHours, RegisterPharmacyRequest } from '../../../models/pharmacy.model';
import { ApprovalStatus, UserRole, ApprovalStatusValue } from '../../../models/user.model';
import { getApprovalStatusName, getApprovalStatusClass, getApprovalStatusEnum } from '../../../core/utils/approval-status.utils';
import { getRoleEnum } from '../../../core/utils/role.utils';


@Component({
  selector: 'app-pharmacy-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="pharmacy-management-container">
      <div class="header">
        <h1>Pharmacy Management</h1>
        <p>View and manage all registered pharmacies</p>
      </div>

      <!-- Search and Filter -->
      <div class="controls-section card">
        <div class="search-filter">
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search pharmacies by name, city, or license..."
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
        </div>
        <div class="stats-summary">
          <span class="stat-item">Total: {{ allPharmacies.length }}</span>
          <span class="stat-item">Pending: {{ getCountByStatus(1) }}</span>
          <span class="stat-item">Approved: {{ getCountByStatus(2) }}</span>
          <span class="stat-item">Rejected: {{ getCountByStatus(3) }}</span>
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
        <p>No pharmacies found matching your criteria.</p>
      </div>

      <!-- Pharmacies Table -->
      <div *ngIf="!isLoading && filteredPharmacies.length > 0" class="pharmacies-table card">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Owner</th>
              <th>License</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let pharmacy of filteredPharmacies">
              <td data-label="Name">
                <div class="pharmacy-name-cell">
                  <strong>{{ pharmacy.name }}</strong>
                  <span class="pharmacy-email">{{ pharmacy.email }}</span>
                </div>
              </td>
              <td data-label="Location">
                <div class="location-cell">
                  <div>{{ pharmacy.city }}, {{ pharmacy.state }}</div>
                  <div class="location-detail">{{ pharmacy.address }}</div>
                </div>
              </td>
              <td data-label="Owner">{{ pharmacy.ownerName || 'N/A' }}</td>
              <td data-label="License">{{ pharmacy.licenseNumber }}</td>
              <td data-label="Status">
                <span class="status-badge" [ngClass]="getApprovalStatusClass(pharmacy.approvalStatus)">
                  {{ getApprovalStatusName(pharmacy.approvalStatus) }}
                </span>
              </td>
              <td data-label="Registered">{{ formatDate(pharmacy.createdAt) }}</td>
              <td data-label="Actions">
                <div class="action-buttons">
                  <button 
                    *ngIf="isPending(pharmacy.approvalStatus)"
                    class="btn btn-sm btn-success" 
                    (click)="updateApproval(pharmacy.id, ApprovalStatus.Approved)"
                    title="Approve"
                    [disabled]="isProcessing"
                  >
                    ✅ Approve
                  </button>
                  <button 
                    *ngIf="isRejected(pharmacy.approvalStatus)"
                    class="btn btn-sm btn-success" 
                    (click)="updateApproval(pharmacy.id, ApprovalStatus.Approved)"
                    title="Approve"
                    [disabled]="isProcessing"
                  >
                    ✅ Approve
                  </button>
                  <button 
                    *ngIf="isPending(pharmacy.approvalStatus)"
                    class="btn btn-sm btn-danger" 
                    (click)="updateApproval(pharmacy.id, ApprovalStatus.Rejected)"
                    title="Reject"
                    [disabled]="isProcessing"
                  >
                    ❌ Reject
                  </button>
                  <button 
                    *ngIf="isApproved(pharmacy.approvalStatus)"
                    class="btn btn-sm btn-danger" 
                    (click)="updateApproval(pharmacy.id, ApprovalStatus.Rejected)"
                    title="Disapprove"
                    [disabled]="isProcessing"
                  >
                    ❌ Disapprove
                  </button>
                  <button 
                    class="btn btn-sm btn-secondary" 
                    (click)="viewPharmacy(pharmacy)"
                    title="View Details"
                  >
                    👁️ View
                  </button>
                  <button 
                    class="btn btn-sm btn-primary" 
                    (click)="editPharmacy(pharmacy)"
                    title="Edit Pharmacy"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    class="btn btn-sm btn-danger" 
                    (click)="deletePharmacy(pharmacy.id, pharmacy.name)"
                    title="Delete Pharmacy"
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

      <!-- View Pharmacy Modal -->
      <div *ngIf="selectedPharmacy && !isEditing" class="modal-overlay" (click)="closeModal()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Pharmacy Details</h2>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="detail-section">
              <h3>Basic Information</h3>
              <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{ selectedPharmacy.name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">License Number:</span>
                <span class="detail-value">{{ selectedPharmacy.licenseNumber }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Contact Information</h3>
              <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ selectedPharmacy.email }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">{{ selectedPharmacy.phoneNumber }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Address</h3>
              <div class="detail-item">
                <span class="detail-label">Address:</span>
                <span class="detail-value">
                  {{ selectedPharmacy.address }}, {{ selectedPharmacy.city }}, 
                  {{ selectedPharmacy.state }} {{ selectedPharmacy.zipCode }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Coordinates:</span>
                <span class="detail-value">{{ selectedPharmacy.latitude }}, {{ selectedPharmacy.longitude }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>Operating Hours</h3>
              <div class="operating-hours-list">
                <div *ngFor="let day of getDays()" class="day-item">
                  <span class="day-name">{{ day.name }}:</span>
                  <span class="day-hours">
                    <ng-container *ngIf="getDayHours(selectedPharmacy, day.key); let dayHours">
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
              <h3>Status & Dates</h3>
              <div class="detail-item">
                <span class="detail-label">Approval Status:</span>
                <span class="status-badge" [ngClass]="getApprovalStatusClass(selectedPharmacy.approvalStatus)">
                  {{ getApprovalStatusName(selectedPharmacy.approvalStatus) }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Pharmacy ID:</span>
                <span class="detail-value">{{ selectedPharmacy.id }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Registered:</span>
                <span class="detail-value">{{ formatDate(selectedPharmacy.createdAt) }}</span>
              </div>
              <div class="detail-item" *ngIf="selectedPharmacy.approvedAt">
                <span class="detail-label">Approved:</span>
                <span class="detail-value">{{ formatDate(selectedPharmacy.approvedAt) }}</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button *ngIf="isPending(selectedPharmacy.approvalStatus)" class="btn btn-success" (click)="updateApproval(selectedPharmacy.id, ApprovalStatus.Approved)" [disabled]="isProcessing">
              Approve Pharmacy
            </button>
            <button *ngIf="isRejected(selectedPharmacy.approvalStatus)" class="btn btn-success" (click)="updateApproval(selectedPharmacy.id, ApprovalStatus.Approved)" [disabled]="isProcessing">
              Approve Pharmacy
            </button>
            <button *ngIf="isPending(selectedPharmacy.approvalStatus)" class="btn btn-danger" (click)="updateApproval(selectedPharmacy.id, ApprovalStatus.Rejected)" [disabled]="isProcessing">
              Reject Pharmacy
            </button>
            <button *ngIf="isApproved(selectedPharmacy.approvalStatus)" class="btn btn-danger" (click)="updateApproval(selectedPharmacy.id, ApprovalStatus.Rejected)" [disabled]="isProcessing">
              Disapprove Pharmacy
            </button>
            <button class="btn btn-primary" (click)="editPharmacy(selectedPharmacy)">Edit Pharmacy</button>
            <button class="btn btn-secondary" (click)="closeModal()">Close</button>
          </div>
        </div>
      </div>

      <!-- Edit Pharmacy Modal -->
      <div *ngIf="selectedPharmacy && isEditing" class="modal-overlay" (click)="closeModal()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Edit Pharmacy: {{ selectedPharmacy.name }}</h2>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>

          <div class="modal-body">
            <form [formGroup]="editForm" (ngSubmit)="savePharmacy()">
              <div class="form-section">
                <h3>Basic Information</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="editName" class="form-label">Pharmacy Name *</label>
                    <input id="editName" type="text" formControlName="name" class="form-input" />
                  </div>
                  <div class="form-group">
                    <label for="editLicense" class="form-label">License Number *</label>
                    <input id="editLicense" type="text" formControlName="licenseNumber" class="form-input" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="editBusinessLicense" class="form-label">Pharmacy Shop Business License *</label>
                  <input id="editBusinessLicense" type="text" formControlName="businessLicense" class="form-input" />
                </div>
              </div>

              <div class="form-section">
                <h3>Contact Information</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="editEmail" class="form-label">Email *</label>
                    <input id="editEmail" type="email" formControlName="email" class="form-input" />
                  </div>
                  <div class="form-group">
                    <label for="editPhone" class="form-label">Phone *</label>
                    <input id="editPhone" type="tel" formControlName="phoneNumber" class="form-input" />
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h3>Address</h3>
                <div class="form-group">
                  <label for="editAddress" class="form-label">Street Address *</label>
                  <input id="editAddress" type="text" formControlName="address" class="form-input" />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="editCity" class="form-label">City *</label>
                    <input id="editCity" type="text" formControlName="city" class="form-input" />
                  </div>
                  <div class="form-group">
                    <label for="editState" class="form-label">State *</label>
                    <input id="editState" type="text" formControlName="state" class="form-input" />
                  </div>
                  <div class="form-group">
                    <label for="editZipCode" class="form-label">Zip Code *</label>
                    <input id="editZipCode" type="text" formControlName="zipCode" class="form-input" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="editLatitude" class="form-label">Latitude *</label>
                    <input id="editLatitude" type="number" step="any" formControlName="latitude" class="form-input" />
                  </div>
                  <div class="form-group">
                    <label for="editLongitude" class="form-label">Longitude *</label>
                    <input id="editLongitude" type="number" step="any" formControlName="longitude" class="form-input" />
                  </div>
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
    .pharmacy-management-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .header {
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

    .pharmacies-table {
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

    .pharmacy-name-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .pharmacy-email {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .location-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .location-detail {
      font-size: 0.75rem;
      color: var(--text-secondary);
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

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #6366f1;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .operating-hours-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .day-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    .day-item:last-child {
      border-bottom: none;
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

    @media (max-width: 1024px) {
      .pharmacy-management-container {
        padding: 1rem 0.5rem;
      }

      .header {
        text-align: left;
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
      .pharmacy-management-container {
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

      .pharmacies-table {
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
export class PharmacyManagementComponent implements OnInit {
  private pharmacyService = inject(PharmacyService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  allPharmacies: Pharmacy[] = [];
  filteredPharmacies: Pharmacy[] = [];
  selectedPharmacy: Pharmacy | null = null;
  isLoading = false;
  isProcessing = false;
  isEditing = false;
  errorMessage = '';
  successMessage = '';
  searchQuery = '';
  statusFilter = 'all';

  editForm!: FormGroup;

  ApprovalStatus = ApprovalStatus;

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
      this.router.navigate(['/home']);
      return;
    }

    // Check for query parameters to set initial filter
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.statusFilter = params['status'];
      }
      this.initializeForm();
      this.loadPharmacies();
    });
  }

  initializeForm(): void {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      licenseNumber: ['', Validators.required],
      businessLicense: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      latitude: [0, Validators.required],
      longitude: [0, Validators.required]
    });
  }

  loadPharmacies(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.pharmacyService.getAllPharmacies().subscribe({
      next: (pharmacies) => {
        this.allPharmacies = pharmacies;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to load pharmacies.';
        console.error('Error loading pharmacies:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allPharmacies];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query) ||
        p.state.toLowerCase().includes(query) ||
        p.licenseNumber.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      const status = parseInt(this.statusFilter);
      filtered = filtered.filter(p => {
        const approvalStatus = p.approvalStatus;
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

    this.filteredPharmacies = filtered;
  }

  getCountByStatus(status: number): number {
    return this.allPharmacies.filter(p => {
      const approvalStatus = p.approvalStatus;
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

  viewPharmacy(pharmacy: Pharmacy): void {
    this.selectedPharmacy = pharmacy;
    this.isEditing = false;
  }

  editPharmacy(pharmacy: Pharmacy): void {
    this.selectedPharmacy = pharmacy;
    this.isEditing = true;
    this.editForm.patchValue({
      name: pharmacy.name,
      licenseNumber: pharmacy.licenseNumber,
      businessLicense: pharmacy.businessLicense,
      email: pharmacy.email,
      phoneNumber: pharmacy.phoneNumber,
      address: pharmacy.address,
      city: pharmacy.city,
      state: pharmacy.state,
      zipCode: pharmacy.zipCode,
      latitude: pharmacy.latitude,
      longitude: pharmacy.longitude
    });
  }

  savePharmacy(): void {
    if (this.editForm.invalid || !this.selectedPharmacy) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.editForm.value;
    const request: RegisterPharmacyRequest = {
      name: formValue.name,
      licenseNumber: formValue.licenseNumber,
      businessLicense: formValue.businessLicense,
      email: formValue.email,
      phoneNumber: formValue.phoneNumber,
      address: formValue.address,
      city: formValue.city,
      state: formValue.state,
      zipCode: formValue.zipCode,
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      operatingHours: this.selectedPharmacy.operatingHours
    };

    this.pharmacyService.updatePharmacy(this.selectedPharmacy.id, request).subscribe({
      next: () => {
        this.isProcessing = false;
        this.successMessage = 'Pharmacy updated successfully!';
        setTimeout(() => {
          this.closeModal();
          this.loadPharmacies();
        }, 1500);
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to update pharmacy.';
      }
    });
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

  updateApproval(pharmacyId: number, status: ApprovalStatus): void {
    const pharmacy = this.allPharmacies.find(p => p.id === pharmacyId);
    const isDisapproving = pharmacy && this.isApproved(pharmacy.approvalStatus) && status === ApprovalStatus.Rejected;
    const isApprovingRejected = pharmacy && this.isRejected(pharmacy.approvalStatus) && status === ApprovalStatus.Approved;
    const action = status === ApprovalStatus.Approved 
      ? (isApprovingRejected ? 'approve this rejected pharmacy' : 'approve')
      : (isDisapproving ? 'disapprove' : 'reject');
    
    if (!confirm(`Are you sure you want to ${action}?`)) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.pharmacyService.updatePharmacyApproval(pharmacyId, { approvalStatus: status }).subscribe({
      next: () => {
        this.isProcessing = false;
        const pharmacy = this.allPharmacies.find(p => p.id === pharmacyId);
        const wasApproved = pharmacy && this.isApproved(pharmacy.approvalStatus);
        const wasRejected = pharmacy && this.isRejected(pharmacy.approvalStatus);
        const isDisapproving = wasApproved && status === ApprovalStatus.Rejected;
        const isApprovingRejected = wasRejected && status === ApprovalStatus.Approved;
        let message = '';
        if (status === ApprovalStatus.Approved) {
          message = isApprovingRejected ? 'approved (was rejected)' : 'approved';
        } else {
          message = isDisapproving ? 'disapproved' : 'rejected';
        }
        this.successMessage = `Pharmacy ${message} successfully!`;
        this.loadPharmacies();
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

  deletePharmacy(pharmacyId: number, pharmacyName: string): void {
    if (!confirm(`Are you sure you want to delete "${pharmacyName}"? This action cannot be undone.`)) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.pharmacyService.deletePharmacy(pharmacyId).subscribe({
      next: () => {
        this.isProcessing = false;
        this.successMessage = 'Pharmacy deleted successfully!';
        setTimeout(() => {
          this.successMessage = '';
          this.loadPharmacies();
        }, 2000);
      },
      error: (error) => {
        this.isProcessing = false;
        this.errorMessage = error.error?.error || error.error?.message || error.message || 'Failed to delete pharmacy.';
      }
    });
  }

  closeModal(): void {
    this.selectedPharmacy = null;
    this.isEditing = false;
    this.editForm.reset();
  }

  getDays() {
    return this.days;
  }

  getDayHours(pharmacy: Pharmacy, dayKey: string) {
    return pharmacy.operatingHours[dayKey as keyof typeof pharmacy.operatingHours];
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getApprovalStatusName = getApprovalStatusName;
  getApprovalStatusClass = getApprovalStatusClass;
}

