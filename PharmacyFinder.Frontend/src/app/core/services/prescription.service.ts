import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prescription, ExtractMedicinesResponse } from '../../models/prescription.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  uploadPrescription(file: File, extractedText?: string): Observable<Prescription> {
    const formData = new FormData();
    formData.append('file', file);
    if (extractedText) {
      formData.append('extractedText', extractedText);
    }
    
    return this.http.post<Prescription>(`${this.apiUrl}/api/prescription/upload`, formData);
  }

  extractMedicines(text: string): Observable<ExtractMedicinesResponse> {
    return this.http.post<ExtractMedicinesResponse>(`${this.apiUrl}/api/prescription/extract-medicines`, { text });
  }

  getPrescription(id: number): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.apiUrl}/api/prescription/${id}`);
  }

  getMyPrescriptions(): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.apiUrl}/api/prescription/my-prescriptions`);
  }

  processPrescription(id: number): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.apiUrl}/api/prescription/${id}/process`, {});
  }
}

