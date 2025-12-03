import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PrescriptionService } from '../../../core/services/prescription.service';
import { MedicineService } from '../../../core/services/medicine.service';
import { Prescription } from '../../../models/prescription.model';
import { Medicine } from '../../../models/medicine.model';
import { createWorker } from 'tesseract.js';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-prescription-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './prescription-upload.component.html',
  styleUrls: ['./prescription-upload.component.css']
})
export class PrescriptionUploadComponent {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading = false;
  isExtracting = false;
  extractionProgress = 0;
  extractedText: string | null = null;
  error: string | null = null;
  successMessage: string | null = null;
  uploadedPrescription: Prescription | null = null;
  enableOCR = true;

  // Medicine search properties
  searchQuery: string = '';
  searchResults: Medicine[] = [];
  isSearching: boolean = false;
  searchError: string | null = null;
  private searchSubject = new Subject<string>();

  constructor(
    private prescriptionService: PrescriptionService,
    private medicineService: MedicineService,
    private router: Router
  ) {
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length < 2) {
          this.searchResults = [];
          this.isSearching = false;
          return of([]);
        }
        this.isSearching = true;
        this.searchError = null;
        return this.medicineService.searchMedicines(query.trim()).pipe(
          catchError(err => {
            this.searchError = 'Failed to search medicines. Please try again.';
            this.isSearching = false;
            console.error('Medicine search error:', err);
            return of([]);
          })
        );
      })
    ).subscribe({
      next: (medicines) => {
        this.searchResults = medicines;
        this.isSearching = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.error = 'Invalid file type. Please upload an image (JPG, PNG, GIF) or PDF file.';
        this.selectedFile = null;
        this.previewUrl = null;
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.error = 'File size too large. Please upload a file smaller than 10MB.';
        this.selectedFile = null;
        this.previewUrl = null;
        return;
      }

      this.selectedFile = file;
      this.error = null;
      this.successMessage = null;
      this.clearSearch(); // Clear previous search when new file is selected

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewUrl = e.target?.result as string;
        };
        reader.readAsDataURL(file);

        // Automatically extract text if OCR is enabled
        if (this.enableOCR) {
          this.extractTextFromImage(file).then(text => {
            this.extractedText = text;
          });
        }
      } else {
        this.previewUrl = null;
        // For PDF files, extraction would need to be handled differently
        // For now, clear any previous extracted text
        if (!this.enableOCR) {
          this.extractedText = null;
        }
      }
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.extractedText = null;
    this.extractionProgress = 0;
    this.isExtracting = false;
    this.error = null;
    this.clearSearch(); // Clear search when file is removed
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async extractTextFromImage(file: File): Promise<string | null> {
    if (!this.enableOCR || !file.type.startsWith('image/')) {
      return null;
    }

    try {
      this.isExtracting = true;
      this.extractionProgress = 0;
      this.error = null;

      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            this.extractionProgress = Math.round(m.progress * 100);
          }
        }
      });

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      this.isExtracting = false;
      this.extractionProgress = 100;
      return text.trim() || null;
    } catch (err) {
      console.error('OCR extraction error:', err);
      this.isExtracting = false;
      this.extractionProgress = 0;
      // Don't fail the upload if OCR fails, just continue without extracted text
      return null;
    }
  }

  async uploadPrescription(): Promise<void> {
    if (!this.selectedFile) {
      this.error = 'Please select a file to upload.';
      return;
    }

    this.isUploading = true;
    this.error = null;
    this.successMessage = null;
    // Don't clear extractedText - keep it visible during upload
    // Text should already be extracted when file was selected, but extract again if needed

    try {
      // Extract text from image if OCR is enabled, it's an image file, and text hasn't been extracted yet
      // (This handles cases where extraction might have failed or was skipped)
      if (this.enableOCR && this.selectedFile.type.startsWith('image/') && !this.extractedText) {
        this.extractedText = await this.extractTextFromImage(this.selectedFile);
      }

      // Upload prescription with extracted text
      this.prescriptionService.uploadPrescription(this.selectedFile, this.extractedText || undefined).subscribe({
        next: (prescription) => {
          this.uploadedPrescription = prescription;
          this.isUploading = false;
          this.successMessage = this.extractedText 
            ? 'Prescription uploaded and processed successfully!'
            : 'Prescription uploaded successfully!';
          
          // Redirect to detail page
          setTimeout(() => {
            this.router.navigate(['/customer/prescriptions', prescription.id]);
          }, 1500);
        },
        error: (err) => {
          this.isUploading = false;
          this.error = err.error?.error || err.error?.message || err.message || 'Failed to upload prescription. Please try again.';
          console.error('Upload error:', err);
        }
      });
    } catch (err) {
      this.isUploading = false;
      this.error = 'Failed to process prescription. Please try again.';
      console.error('Upload error:', err);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.searchError = null;
  }
}

