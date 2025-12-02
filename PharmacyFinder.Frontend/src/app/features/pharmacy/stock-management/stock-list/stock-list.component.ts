import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MedicineService } from '../../../../core/services/medicine.service';
import { Medicine } from '../../../../models/medicine.model';
import { PharmacyService } from '../../../../core/services/pharmacy.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-stock-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './stock-list.component.html',
    styleUrls: ['./stock-list.component.css']
})
export class StockListComponent implements OnInit {
    medicines: Medicine[] = [];
    pharmacies: any[] = []; // Using any to avoid import issues, or import Pharmacy interface
    selectedPharmacyId: number | null | 'all' = null;
    isLoading = true;
    error: string | null = null;
    isOwner = false;

    constructor(
        private medicineService: MedicineService,
        private pharmacyService: PharmacyService,
        private authService: AuthService,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.checkOwnershipAndLoadMedicines();
    }

    checkOwnershipAndLoadMedicines(): void {
        this.isLoading = true;
        this.pharmacyService.getMyPharmacies().subscribe({
            next: (pharmacies) => {
                console.log('Pharmacies loaded:', pharmacies);
                if (pharmacies && pharmacies.length > 0) {
                    this.pharmacies = pharmacies;
                    // Default to "All" if multiple pharmacies exist
                    if (pharmacies.length > 1) {
                        this.selectedPharmacyId = 'all';
                    } else {
                        this.selectedPharmacyId = pharmacies[0].id;
                    }
                    console.log('Selected initial pharmacy:', this.selectedPharmacyId);
                    this.isOwner = true;
                    this.loadMedicines();
                } else {
                    this.error = 'No pharmacy found. Please register a pharmacy first.';
                    this.isLoading = false;
                }
            },
            error: (err) => {
                this.error = 'Failed to load pharmacy details.';
                this.isLoading = false;
                console.error('Error loading pharmacies:', err);
            }
        });
    }

    onPharmacyChange(event: Event): void {
        const selectElement = event.target as HTMLSelectElement;
        const value = selectElement.value;
        let pharmacyId: number | null | 'all' = null;
        
        if (value === 'all') {
            pharmacyId = 'all';
        } else if (value) {
            pharmacyId = Number(value);
        }
        
        console.log('Pharmacy changed to:', pharmacyId);
        
        if (pharmacyId !== this.selectedPharmacyId) {
            this.selectedPharmacyId = pharmacyId;
            if (!this.selectedPharmacyId) {
                this.medicines = [];
                this.isLoading = false;
                return;
            }
            this.loadMedicines();
        }
    }

    loadMedicines(): void {
        if (!this.selectedPharmacyId) {
            console.warn('No pharmacy selected, cannot load medicines');
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        this.error = null;
        this.medicines = [];

        // If "All" is selected, load medicines from all pharmacies
        if (this.selectedPharmacyId === 'all') {
            console.log('Loading medicines from all pharmacies');
            this.loadAllMedicines();
        } else {
            console.log('Loading medicines for pharmacy:', this.selectedPharmacyId);
            this.medicineService.getMedicinesByPharmacy(this.selectedPharmacyId).subscribe({
                next: (data) => {
                    console.log('Medicines loaded:', data.length, 'items');
                    this.medicines = data;
                    this.isLoading = false;
                    this.error = null;
                },
                error: (err) => {
                    this.error = 'Failed to load medicines.';
                    this.isLoading = false;
                    console.error('Error loading medicines:', err);
                }
            });
        }
    }

    loadAllMedicines(): void {
        // Create observables for each pharmacy
        const medicineObservables = this.pharmacies.map(pharmacy =>
            this.medicineService.getMedicinesByPharmacy(pharmacy.id).pipe(
                catchError(err => {
                    console.error(`Error loading medicines for pharmacy ${pharmacy.id}:`, err);
                    return of([]); // Return empty array on error
                })
            )
        );

        // Use forkJoin to load all medicines in parallel
        forkJoin(medicineObservables).subscribe({
            next: (results) => {
                // Flatten the array of arrays into a single array
                const allMedicines = results.flat();
                console.log('All medicines loaded:', allMedicines.length, 'items from', this.pharmacies.length, 'pharmacies');
                
                // Sort by pharmacy name, then by medicine name
                allMedicines.sort((a, b) => {
                    const pharmacyA = this.getPharmacyName(a.pharmacyId);
                    const pharmacyB = this.getPharmacyName(b.pharmacyId);
                    if (pharmacyA !== pharmacyB) {
                        return pharmacyA.localeCompare(pharmacyB);
                    }
                    return a.name.localeCompare(b.name);
                });
                
                this.medicines = allMedicines;
                this.isLoading = false;
                this.error = null;
            },
            error: (err) => {
                this.error = 'Failed to load medicines from all pharmacies.';
                this.isLoading = false;
                console.error('Error loading all medicines:', err);
            }
        });
    }

    getPharmacyName(pharmacyId: number): string {
        const pharmacy = this.pharmacies.find(p => p.id === pharmacyId);
        return pharmacy ? pharmacy.name : 'Unknown Pharmacy';
    }

    getAddMedicineQueryParams(): any {
        // If a specific pharmacy is selected (not 'all'), pass it as query param
        if (this.selectedPharmacyId && this.selectedPharmacyId !== 'all') {
            return { pharmacyId: this.selectedPharmacyId };
        }
        return {};
    }

    deleteMedicine(id: number): void {
        if (confirm('Are you sure you want to delete this medicine?')) {
            this.medicineService.deleteMedicine(id).subscribe({
                next: () => {
                    this.medicines = this.medicines.filter(m => m.id !== id);
                },
                error: (err) => {
                    alert('Failed to delete medicine.');
                    console.error(err);
                }
            });
        }
    }
}
