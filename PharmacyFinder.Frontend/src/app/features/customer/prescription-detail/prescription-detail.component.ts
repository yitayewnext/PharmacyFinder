import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PrescriptionService } from '../../../core/services/prescription.service';
import { Prescription } from '../../../models/prescription.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-prescription-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './prescription-detail.component.html',
  styleUrls: ['./prescription-detail.component.css']
})
export class PrescriptionDetailComponent implements OnInit {
  prescription: Prescription | null = null;
  isLoading = true;
  isProcessing = false;
  error: string | null = null;
  prescriptionId: number | null = null;

  constructor(
    private prescriptionService: PrescriptionService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.prescriptionId = +params['id'];
      if (this.prescriptionId) {
        this.loadPrescription();
      }
    });
  }

  loadPrescription(): void {
    if (!this.prescriptionId) return;

    this.isLoading = true;
    this.error = null;

    this.prescriptionService.getPrescription(this.prescriptionId).subscribe({
      next: (data) => {
        this.prescription = data;
        this.isLoading = false;
        // Debug: Check medicine data structure
        if (data.medicines) {
          console.log('Loaded prescription medicines:', JSON.stringify(data.medicines, null, 2));
          data.medicines.forEach((med: any, idx: number) => {
            console.log(`Medicine ${idx + 1} - Full Object:`, med);
            console.log(`Medicine ${idx + 1} - Extracted Name:`, med.medicineName);
            console.log(`Medicine ${idx + 1} - Matched Medicine ID:`, med.matchedMedicineId);
            console.log(`Medicine ${idx + 1} - Matched Medicine Object:`, med.matchedMedicine);
            console.log(`Medicine ${idx + 1} - Is Available:`, med.isAvailable);
            console.log(`Medicine ${idx + 1} - Has Matched Medicine:`, !!med.matchedMedicine);
            if (med.matchedMedicine) {
              console.log(`Medicine ${idx + 1} - Matched Name:`, med.matchedMedicine.name);
            }
          });
        }
      },
      error: (err) => {
        this.error = 'Failed to load prescription. Please try again.';
        this.isLoading = false;
        console.error('Error loading prescription:', err);
      }
    });
  }

  processPrescription(): void {
    if (!this.prescriptionId) return;

    this.isProcessing = true;
    this.error = null;

    this.prescriptionService.processPrescription(this.prescriptionId).subscribe({
      next: (data) => {
        this.prescription = data;
        this.isProcessing = false;
        // Reload to get updated data
        this.loadPrescription();
      },
      error: (err) => {
        this.isProcessing = false;
        this.error = err.error?.error || err.error?.message || err.message || 'Failed to process prescription.';
        console.error('Error processing prescription:', err);
      }
    });
  }

  getStatusClass(status?: string): string {
    if (!status) return 'status-pending';
    
    switch (status.toLowerCase()) {
      case 'processed':
        return 'status-processed';
      case 'failed':
        return 'status-failed';
      default:
        return 'status-pending';
    }
  }

  getStatusText(status?: string): string {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getFullImageUrl(imageUrl: string): string {
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    // Otherwise, prepend the API URL from environment
    return `${environment.apiUrl}${imageUrl}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QcmVzY3JpcHRpb24gSW1hZ2U8L3RleHQ+PC9zdmc+';
    }
  }

  formatExtractedText(text: string | undefined): string {
    if (!text) return '';
    
    // Clean up the text: remove excessive whitespace, fix line breaks
    let cleaned = text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')     // Handle Mac line endings
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple line breaks to double
      .replace(/[ \t]+/g, ' ')   // Replace multiple spaces/tabs with single space
      .trim();
    
    // Split into lines and clean each line
    const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    return lines.join('\n');
  }

  searchMedicine(medicineName: string): void {
    // Navigate to medicine search with the medicine name as query
    this.router.navigate(['/customer/medicines'], { 
      queryParams: { query: medicineName } 
    });
  }

  viewMatchedMedicine(medicineId: number): void {
    // Navigate to medicine detail or pharmacy detail
    this.router.navigate(['/customer/medicines'], { 
      queryParams: { medicineId: medicineId } 
    });
  }

  viewPharmacy(pharmacyId: number): void {
    // Navigate to pharmacy detail page
    this.router.navigate(['/customer/pharmacies', pharmacyId]);
  }

  getDisplayMedicineName(medicine: any): string {
    // Priority: matched medicine name > extracted name
    if (medicine?.matchedMedicine && medicine.matchedMedicine.name) {
      return medicine.matchedMedicine.name;
    }
    // Fallback to extracted name
    return medicine?.medicineName || 'Unknown Medicine';
  }

  shouldShowExtractedName(medicine: any): boolean {
    // Show extracted name hint only if there's a matched medicine with a different name
    if (!medicine?.matchedMedicine || !medicine?.matchedMedicine?.name || !medicine?.medicineName) {
      return false;
    }
    const matchedName = (medicine.matchedMedicine.name || '').toLowerCase().trim();
    const extractedName = (medicine.medicineName || '').toLowerCase().trim();
    return matchedName !== extractedName && matchedName.length > 0 && extractedName.length > 0;
  }

  hasNoMatchedMedicines(): boolean {
    if (!this.prescription || !this.prescription.medicines || this.prescription.medicines.length === 0) {
      return false;
    }
    return this.prescription.medicines.every((m: any) => !m.matchedMedicine);
  }

  reprocessPrescription(): void {
    this.processPrescription();
  }
}

