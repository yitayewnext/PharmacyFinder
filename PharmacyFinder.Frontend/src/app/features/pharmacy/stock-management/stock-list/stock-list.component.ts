import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MedicineService } from '../../../../core/services/medicine.service';
import { Medicine } from '../../../../models/medicine.model';
import { PharmacyService } from '../../../../core/services/pharmacy.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-stock-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './stock-list.component.html',
    styleUrls: ['./stock-list.component.css']
})
export class StockListComponent implements OnInit {
    medicines: Medicine[] = [];
    pharmacyId: number | null = null;
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
        this.pharmacyService.getMyPharmacy().subscribe({
            next: (pharmacy) => {
                if (pharmacy) {
                    this.pharmacyId = pharmacy.id;
                    this.isOwner = true; // If we get a pharmacy from 'my-pharmacy', the user is the owner
                    this.loadMedicines();
                } else {
                    this.error = 'Pharmacy not found.';
                    this.isLoading = false;
                }
            },
            error: (err) => {
                this.error = 'Failed to load pharmacy details.';
                this.isLoading = false;
                console.error(err);
            }
        });
    }

    loadMedicines(): void {
        if (!this.pharmacyId) return;

        this.medicineService.getMedicinesByPharmacy(this.pharmacyId).subscribe({
            next: (data) => {
                this.medicines = data;
                this.isLoading = false;
            },
            error: (err) => {
                this.error = 'Failed to load medicines.';
                this.isLoading = false;
                console.error(err);
            }
        });
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
