import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Medicine, CreateMedicine, UpdateMedicine, MedicineSearchResult } from '../../models/medicine.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class MedicineService {
    private apiUrl = `${environment.apiUrl}/api/medicine`;

    constructor(private http: HttpClient) { }

    addMedicine(pharmacyId: number, medicine: CreateMedicine): Observable<Medicine> {
        return this.http.post<Medicine>(`${this.apiUrl}/${pharmacyId}`, medicine);
    }

    updateMedicine(id: number, medicine: UpdateMedicine): Observable<Medicine> {
        return this.http.put<Medicine>(`${this.apiUrl}/${id}`, medicine);
    }

    deleteMedicine(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getMedicine(id: number): Observable<Medicine> {
        return this.http.get<Medicine>(`${this.apiUrl}/${id}`);
    }

    getMedicinesByPharmacy(pharmacyId: number): Observable<Medicine[]> {
        return this.http.get<Medicine[]>(`${this.apiUrl}/pharmacy/${pharmacyId}`);
    }

    searchMedicines(query: string): Observable<Medicine[]> {
        let params = new HttpParams().set('query', query);
        return this.http.get<Medicine[]>(`${this.apiUrl}/search`, { params });
    }

    searchMedicinesWithPharmacy(
        query: string,
        latitude?: number,
        longitude?: number,
        availableOnly?: boolean,
        minPrice?: number,
        maxPrice?: number,
        category?: string,
        maxDistanceKm?: number
    ): Observable<MedicineSearchResult[]> {
        let params = new HttpParams().set('query', query);
        if (latitude !== undefined && latitude !== null) params = params.set('latitude', latitude.toString());
        if (longitude !== undefined && longitude !== null) params = params.set('longitude', longitude.toString());
        if (availableOnly !== undefined && availableOnly !== null) params = params.set('availableOnly', availableOnly.toString());
        if (minPrice !== undefined && minPrice !== null) params = params.set('minPrice', minPrice.toString());
        if (maxPrice !== undefined && maxPrice !== null) params = params.set('maxPrice', maxPrice.toString());
        if (category && category.trim()) params = params.set('category', category.trim());
        if (maxDistanceKm !== undefined && maxDistanceKm !== null) params = params.set('maxDistanceKm', maxDistanceKm.toString());
        
        return this.http.get<MedicineSearchResult[]>(`${this.apiUrl}/search-with-pharmacy`, { params });
    }
}
