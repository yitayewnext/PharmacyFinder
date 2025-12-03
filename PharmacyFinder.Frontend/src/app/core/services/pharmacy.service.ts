import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pharmacy, PharmacySearchResult, RegisterPharmacyRequest, UpdatePharmacyApprovalRequest } from '../../models/pharmacy.model';
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

  getMyPharmacies(): Observable<Pharmacy[]> {
    return this.http.get<Pharmacy[]>(`${this.apiUrl}/api/pharmacy/my-pharmacies`);
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

  searchPharmacies(
    query?: string, 
    city?: string, 
    state?: string, 
    zipCode?: string,
    latitude?: number,
    longitude?: number,
    maxDistanceKm?: number
  ): Observable<PharmacySearchResult[]> {
    let params = new HttpParams();
    // Only add non-empty parameters
    if (query && query.trim()) params = params.set('query', query.trim());
    if (city && city.trim()) params = params.set('city', city.trim());
    if (state && state.trim()) params = params.set('state', state.trim());
    if (zipCode && zipCode.trim()) params = params.set('zipCode', zipCode.trim());
    if (latitude !== undefined && latitude !== null) params = params.set('latitude', latitude.toString());
    if (longitude !== undefined && longitude !== null) params = params.set('longitude', longitude.toString());
    if (maxDistanceKm !== undefined && maxDistanceKm !== null) params = params.set('maxDistanceKm', maxDistanceKm.toString());
    
    return this.http.get<PharmacySearchResult[]>(`${this.apiUrl}/api/pharmacy/search`, { params });
  }

  searchPharmaciesByMedicine(
    medicineName?: string,
    latitude?: number,
    longitude?: number,
    availableOnly?: boolean,
    maxPrice?: number,
    maxDistanceKm?: number
  ): Observable<PharmacySearchResult[]> {
    let params = new HttpParams();
    if (medicineName && medicineName.trim()) params = params.set('medicineName', medicineName.trim());
    if (latitude !== undefined && latitude !== null) params = params.set('latitude', latitude.toString());
    if (longitude !== undefined && longitude !== null) params = params.set('longitude', longitude.toString());
    if (availableOnly !== undefined && availableOnly !== null) params = params.set('availableOnly', availableOnly.toString());
    if (maxPrice !== undefined && maxPrice !== null) params = params.set('maxPrice', maxPrice.toString());
    if (maxDistanceKm !== undefined && maxDistanceKm !== null) params = params.set('maxDistanceKm', maxDistanceKm.toString());
    
    return this.http.get<PharmacySearchResult[]>(`${this.apiUrl}/api/pharmacy/search-by-medicine`, { params });
  }
}

