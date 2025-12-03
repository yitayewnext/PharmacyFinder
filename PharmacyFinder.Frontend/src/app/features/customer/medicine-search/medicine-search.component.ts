import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MedicineService } from '../../../core/services/medicine.service';
import { MedicineSearchResult } from '../../../models/medicine.model';

@Component({
  selector: 'app-medicine-search',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './medicine-search.component.html',
  styleUrls: ['./medicine-search.component.css']
})
export class MedicineSearchComponent implements OnInit {
  medicines: MedicineSearchResult[] = [];
  filteredMedicines: MedicineSearchResult[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Search filters
  searchQuery: string = '';
  availableOnly: boolean = false;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  category: string = '';
  maxDistanceKm: number | null = null;
  
  // User location for distance calculation
  userLatitude: number | null = null;
  userLongitude: number | null = null;
  
  // Sorting
  sortBy: 'price' | 'distance' | 'name' = 'price';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(
    private medicineService: MedicineService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.requestUserLocation();
    
    // Check for query parameters
    this.route.queryParams.subscribe(params => {
      if (params['query']) {
        this.searchQuery = params['query'];
        // Auto-search if query is provided
        if (this.searchQuery && this.searchQuery.trim()) {
          // Use setTimeout to ensure component is fully initialized
          setTimeout(() => {
            this.searchMedicines();
          }, 100);
        } else {
          // Load all medicines if no query
          this.loadAllMedicines();
        }
      } else {
        // Load all medicines by default when no query parameter
        this.loadAllMedicines();
      }
    });
  }

  requestUserLocation(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLatitude = position.coords.latitude;
          this.userLongitude = position.coords.longitude;
        },
        (error) => {
          console.log('Location permission denied or unavailable:', error);
        }
      );
    }
  }

  loadAllMedicines(): void {
    this.isLoading = true;
    this.error = null;
    this.medicines = [];
    this.filteredMedicines = [];

    // Search with empty query to get all medicines
    this.medicineService.searchMedicinesWithPharmacy(
      '', // Empty query to get all medicines
      this.userLatitude || undefined,
      this.userLongitude || undefined,
      this.availableOnly || undefined,
      this.minPrice || undefined,
      this.maxPrice || undefined,
      this.category?.trim() || undefined,
      this.maxDistanceKm || undefined
    ).subscribe({
      next: (data) => {
        this.medicines = data || [];
        this.filteredMedicines = data || [];
        this.sortResults();
        this.isLoading = false;
        this.error = null;
      },
      error: (err) => {
        this.isLoading = false;
        const errorMessage = err.error?.error || err.error?.message || err.message || 'Failed to load medicines. Please try again.';
        this.error = errorMessage;
        console.error('Error loading medicines:', err);
        this.medicines = [];
        this.filteredMedicines = [];
      }
    });
  }

  searchMedicines(): void {
    const trimmedQuery = this.searchQuery?.trim();
    
    // If no query, load all medicines
    if (!trimmedQuery) {
      this.loadAllMedicines();
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.medicines = [];
    this.filteredMedicines = [];

    this.medicineService.searchMedicinesWithPharmacy(
      trimmedQuery,
      this.userLatitude || undefined,
      this.userLongitude || undefined,
      this.availableOnly || undefined,
      this.minPrice || undefined,
      this.maxPrice || undefined,
      this.category?.trim() || undefined,
      this.maxDistanceKm || undefined
    ).subscribe({
      next: (data) => {
        this.medicines = data || [];
        this.filteredMedicines = data || [];
        this.sortResults();
        this.isLoading = false;
        // Clear any previous errors when search completes successfully
        if (this.filteredMedicines.length > 0) {
          this.error = null;
        }
      },
      error: (err) => {
        this.isLoading = false;
        const errorMessage = err.error?.error || err.error?.message || err.message || 'Failed to search medicines. Please try again.';
        this.error = errorMessage;
        console.error('Error searching medicines:', err);
        this.medicines = [];
        this.filteredMedicines = [];
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.availableOnly = false;
    this.minPrice = null;
    this.maxPrice = null;
    this.category = '';
    this.maxDistanceKm = null;
    this.error = null;
    // Reload all medicines when clearing search
    this.loadAllMedicines();
  }

  sortResults(): void {
    this.filteredMedicines = [...this.medicines];
    
    if (this.sortBy === 'price') {
      this.filteredMedicines.sort((a, b) => {
        return this.sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      });
    } else if (this.sortBy === 'distance') {
      this.filteredMedicines.sort((a, b) => {
        const distA = a.distanceInKm ?? Number.MAX_VALUE;
        const distB = b.distanceInKm ?? Number.MAX_VALUE;
        return this.sortOrder === 'asc' ? distA - distB : distB - distA;
      });
    } else if (this.sortBy === 'name') {
      this.filteredMedicines.sort((a, b) => {
        return this.sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
    }
  }

  onSortChange(): void {
    this.sortResults();
  }

  viewPharmacy(id: number): void {
    this.router.navigate(['/customer/pharmacies', id]);
  }

  getDirections(latitude: number, longitude: number): void {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  }

  formatDistance(km?: number): string {
    if (!km) return '';
    if (km < 1) {
      return `${Math.round(km * 1000)}m away`;
    }
    return `${km.toFixed(1)}km away`;
  }

  getPharmacyAddress(medicine: MedicineSearchResult): string {
    const parts = [
      medicine.pharmacyAddress,
      medicine.pharmacyCity,
      medicine.pharmacyState
    ].filter(part => part && part.trim());
    
    return parts.join(', ');
  }

  formatStockStatus(medicine: MedicineSearchResult): string {
    if (medicine.isAvailable) {
      return `✓ In Stock (${medicine.quantity})`;
    }
    return '✗ Out of Stock';
  }

  groupByMedicineName(): { name: string; results: MedicineSearchResult[] }[] {
    const grouped = new Map<string, MedicineSearchResult[]>();
    
    this.filteredMedicines.forEach(medicine => {
      if (!grouped.has(medicine.name)) {
        grouped.set(medicine.name, []);
      }
      grouped.get(medicine.name)!.push(medicine);
    });
    
    return Array.from(grouped.entries()).map(([name, results]) => ({
      name,
      results: results.sort((a, b) => a.price - b.price) // Sort by price within group
    }));
  }
}

