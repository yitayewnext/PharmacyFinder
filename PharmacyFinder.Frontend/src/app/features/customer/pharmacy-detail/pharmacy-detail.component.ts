import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { Pharmacy } from '../../../models/pharmacy.model';

@Component({
  selector: 'app-pharmacy-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pharmacy-detail.component.html',
  styleUrls: ['./pharmacy-detail.component.css']
})
export class PharmacyDetailComponent implements OnInit {
  pharmacy: Pharmacy | null = null;
  isLoading = true;
  error: string | null = null;
  pharmacyId: number | null = null;

  constructor(
    private pharmacyService: PharmacyService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.pharmacyId = +params['id'];
      if (this.pharmacyId) {
        this.loadPharmacy();
      }
    });
  }

  loadPharmacy(): void {
    if (!this.pharmacyId) return;

    this.isLoading = true;
    this.error = null;

    this.pharmacyService.getPharmacyById(this.pharmacyId).subscribe({
      next: (data) => {
        this.pharmacy = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load pharmacy details. Please try again.';
        this.isLoading = false;
        console.error('Error loading pharmacy:', err);
      }
    });
  }

  getDirections(): void {
    if (!this.pharmacy) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${this.pharmacy.latitude},${this.pharmacy.longitude}`;
    window.open(url, '_blank');
  }

  getFullAddress(): string {
    if (!this.pharmacy) return '';
    const parts = [
      this.pharmacy.address,
      this.pharmacy.city,
      this.pharmacy.state,
      this.pharmacy.zipCode
    ].filter(part => part && part.trim());
    return parts.join(', ');
  }

  formatOperatingHours(): string {
    if (!this.pharmacy || !this.pharmacy.operatingHours) return 'Not specified';
    
    const hours = this.pharmacy.operatingHours;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayKeysPascal = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    let formatted = '';
    dayKeys.forEach((day, index) => {
      const dayHours = (hours as any)[day] || (hours as any)[dayKeysPascal[index]];
      if (dayHours && dayHours.isOpen && dayHours.openTime && dayHours.closeTime) {
        if (formatted) formatted += '\n';
        formatted += `${days[index]}: ${dayHours.openTime} - ${dayHours.closeTime}`;
      }
    });
    
    return formatted || 'Not specified';
  }
}

