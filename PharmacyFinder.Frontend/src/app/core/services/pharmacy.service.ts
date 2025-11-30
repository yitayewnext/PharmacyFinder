import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pharmacy, RegisterPharmacyRequest, UpdatePharmacyApprovalRequest } from '../../models/pharmacy.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PharmacyService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  registerPharmacy(request: RegisterPharmacyRequest): Observable<Pharmacy> {
    return this.http.post<Pharmacy>(`${this.apiUrl}/api/pharmacy/register`, request);
  }

  getPharmacyById(id: number): Observable<Pharmacy> {
    return this.http.get<Pharmacy>(`${this.apiUrl}/api/pharmacy/${id}`);
  }

  getMyPharmacy(): Observable<Pharmacy> {
    return this.http.get<Pharmacy>(`${this.apiUrl}/api/pharmacy/my-pharmacy`);
  }

  getPendingPharmacies(): Observable<Pharmacy[]> {
    return this.http.get<Pharmacy[]>(`${this.apiUrl}/api/pharmacy/pending`);
  }

  getAllPharmacies(): Observable<Pharmacy[]> {
    return this.http.get<Pharmacy[]>(`${this.apiUrl}/api/pharmacy/all`);
  }

  updatePharmacyApproval(pharmacyId: number, request: UpdatePharmacyApprovalRequest): Observable<Pharmacy> {
    return this.http.put<Pharmacy>(`${this.apiUrl}/api/pharmacy/${pharmacyId}/approval`, request);
  }

  updatePharmacy(pharmacyId: number, request: RegisterPharmacyRequest): Observable<Pharmacy> {
    return this.http.put<Pharmacy>(`${this.apiUrl}/api/pharmacy/${pharmacyId}`, request);
  }

  deletePharmacy(pharmacyId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/pharmacy/${pharmacyId}`);
  }
}

