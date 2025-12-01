import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Medicine, CreateMedicine, UpdateMedicine } from '../../models/medicine.model';
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
}
