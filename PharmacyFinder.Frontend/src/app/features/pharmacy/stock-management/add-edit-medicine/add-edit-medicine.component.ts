import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { combineLatest } from 'rxjs';
import { MedicineService } from '../../../../core/services/medicine.service';
import { PharmacyService } from '../../../../core/services/pharmacy.service';
import { CreateMedicine, UpdateMedicine } from '../../../../models/medicine.model';

@Component({
    selector: 'app-add-edit-medicine',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
    templateUrl: './add-edit-medicine.component.html',
    styleUrls: ['./add-edit-medicine.component.css']
})
export class AddEditMedicineComponent implements OnInit {
    medicineForm: FormGroup;
    isEditMode = false;
    medicineId: number | null = null;
    pharmacies: any[] = [];
    pharmacyId: number | null = null;
    isLoading = false;
    error: string | null = null;

    constructor(
        private fb: FormBuilder,
        private medicineService: MedicineService,
        private pharmacyService: PharmacyService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.medicineForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(100)]],
            description: ['', [Validators.maxLength(500)]],
            manufacturer: ['', [Validators.maxLength(100)]],
            price: [0, [Validators.required, Validators.min(0)]],
            quantity: [0, [Validators.required, Validators.min(0)]],
            expiryDate: ['', [Validators.required]],
            isPrescriptionRequired: [false],
            category: ['', [Validators.maxLength(50)]]
        });
    }

    ngOnInit(): void {
        // Check if we're in edit mode first
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.medicineId = +params['id'];
                this.loadMedicine(this.medicineId);
            }
        });

        // Load pharmacies and check query params
        combineLatest([
            this.pharmacyService.getMyPharmacies(),
            this.route.queryParams
        ]).subscribe({
            next: ([pharmacies, queryParams]) => {
                if (pharmacies && pharmacies.length > 0) {
                    this.pharmacies = pharmacies;
                    // If not in edit mode, check query params for pharmacy ID
                    if (!this.isEditMode) {
                        if (queryParams['pharmacyId']) {
                            const queryPharmacyId = Number(queryParams['pharmacyId']);
                            // Verify the pharmacy ID exists in user's pharmacies
                            const pharmacy = pharmacies.find(p => p.id === queryPharmacyId);
                            if (pharmacy) {
                                this.pharmacyId = queryPharmacyId;
                                console.log('Using pharmacy from query param:', this.pharmacyId);
                            } else {
                                // If invalid, default to first pharmacy
                                this.pharmacyId = pharmacies[0].id;
                                console.log('Invalid pharmacy ID in query, defaulting to first:', this.pharmacyId);
                            }
                        } else {
                            // No query param, default to first pharmacy
                            this.pharmacyId = pharmacies[0].id;
                            console.log('No query param, defaulting to first pharmacy:', this.pharmacyId);
                        }
                    }
                } else {
                    this.error = 'No pharmacy found. Please register a pharmacy first.';
                }
            },
            error: (err) => {
                this.error = 'Failed to load pharmacy details.';
                console.error(err);
            }
        });
    }

    loadMedicine(id: number): void {
        this.isLoading = true;
        this.medicineService.getMedicine(id).subscribe({
            next: (medicine) => {
                // Format date for input type="date"
                const expiryDate = new Date(medicine.expiryDate).toISOString().split('T')[0];

                // Set pharmacy ID from medicine
                this.pharmacyId = medicine.pharmacyId;

                this.medicineForm.patchValue({
                    name: medicine.name,
                    description: medicine.description,
                    manufacturer: medicine.manufacturer,
                    price: medicine.price,
                    quantity: medicine.quantity,
                    expiryDate: expiryDate,
                    isPrescriptionRequired: medicine.isPrescriptionRequired,
                    category: medicine.category
                });
                this.isLoading = false;
            },
            error: (err) => {
                this.error = 'Failed to load medicine details.';
                this.isLoading = false;
                console.error(err);
            }
        });
    }

    onSubmit(): void {
        console.log('Form submitted');
        console.log('Form valid:', this.medicineForm.valid);
        console.log('Form value:', this.medicineForm.value);

        if (this.medicineForm.invalid) {
            console.error('Form is invalid');
            Object.keys(this.medicineForm.controls).forEach(key => {
                const control = this.medicineForm.get(key);
                if (control?.invalid) {
                    console.error(`Field ${key} is invalid:`, control.errors);
                }
            });
            return;
        }

        this.isLoading = true;
        this.error = null;

        if (this.isEditMode && this.medicineId) {
            const updateDto: UpdateMedicine = this.medicineForm.value;
            console.log('Updating medicine:', this.medicineId, updateDto);
            this.medicineService.updateMedicine(this.medicineId, updateDto).subscribe({
                next: (response) => {
                    console.log('Medicine updated successfully:', response);
                    this.router.navigate(['/pharmacy/stock']);
                },
                error: (err) => {
                    console.error('Update error:', err);
                    this.error = `Failed to update medicine: ${err.error?.error || err.message || 'Unknown error'}`;
                    this.isLoading = false;
                }
            });
        } else {
            if (!this.pharmacyId) {
                this.error = 'Pharmacy ID not found. Please ensure you have registered a pharmacy.';
                this.isLoading = false;
                console.error('Pharmacy ID is null');
                return;
            }
            const createDto: CreateMedicine = this.medicineForm.value;
            console.log('Adding medicine to pharmacy:', this.pharmacyId);
            console.log('Medicine data:', createDto);

            this.medicineService.addMedicine(this.pharmacyId, createDto).subscribe({
                next: (response) => {
                    console.log('Medicine added successfully:', response);
                    this.router.navigate(['/pharmacy/stock']);
                },
                error: (err) => {
                    console.error('Add medicine error:', err);
                    console.error('Error status:', err.status);
                    console.error('Error message:', err.message);
                    console.error('Error details:', err.error);

                    let errorMessage = 'Failed to add medicine.';
                    if (err.status === 401) {
                        errorMessage = 'Unauthorized. Please login again.';
                    } else if (err.status === 403) {
                        errorMessage = 'Forbidden. You do not have permission to add medicines.';
                    } else if (err.error?.error) {
                        errorMessage = `Failed to add medicine: ${err.error.error}`;
                    } else if (err.message) {
                        errorMessage = `Failed to add medicine: ${err.message}`;
                    }

                    this.error = errorMessage;
                    this.isLoading = false;
                }
            });
        }
    }
}
