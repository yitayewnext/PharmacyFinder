import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PharmacyService } from '../../../core/services/pharmacy.service';
import { Pharmacy, PharmacySearchResult } from '../../../models/pharmacy.model';

@Component({
  selector: 'app-pharmacy-search',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './pharmacy-search.component.html',
  styleUrls: ['./pharmacy-search.component.css']
})
export class PharmacySearchComponent implements OnInit {
  pharmacies: PharmacySearchResult[] = [];
  filteredPharmacies: PharmacySearchResult[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Location search filters
  searchQuery: string = '';
  searchCity: string = '';
  searchState: string = '';
  searchZipCode: string = '';
  maxDistanceKm: number | null = null;
  
  // User location for distance calculation
  userLatitude: number | null = null;
  userLongitude: number | null = null;
  locationError: string | null = null;
  
  // Show all pharmacies on initial load
  showAll = true;

  constructor(
    private pharmacyService: PharmacyService,
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
            this.searchPharmacies();
          }, 100);
        } else {
          this.loadAllPharmacies();
        }
      } else {
        this.loadAllPharmacies();
      }
    });
  }

  requestUserLocation(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLatitude = position.coords.latitude;
          this.userLongitude = position.coords.longitude;
          this.locationError = null;
        },
        (error) => {
          console.log('Location permission denied or unavailable:', error);
          this.locationError = 'Location access denied. Distance filtering will not be available.';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      this.locationError = 'Geolocation is not supported by this browser.';
    }
  }

  loadAllPharmacies(): void {
    this.isLoading = true;
    this.error = null;
    this.showAll = true;

    this.pharmacyService.searchPharmacies(
      undefined,
      undefined,
      undefined,
      undefined,
      this.userLatitude || undefined,
      this.userLongitude || undefined,
      undefined
    ).subscribe({
      next: (data) => {
        this.pharmacies = data;
        this.filteredPharmacies = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        const errorMessage = err.error?.error || err.error?.message || err.message || 'Failed to load pharmacies. Please try again.';
        this.error = errorMessage;
        console.error('Error loading pharmacies:', err);
      }
    });
  }

  searchPharmacies(): void {
    // Location-based search
    const hasTextFilters = (this.searchQuery && this.searchQuery.trim()) ||
                           (this.searchCity && this.searchCity.trim()) ||
                           (this.searchState && this.searchState.trim()) ||
                           (this.searchZipCode && this.searchZipCode.trim());
    
    const hasLocationFilter = (this.userLatitude && this.userLongitude) && 
                              (this.maxDistanceKm !== null && this.maxDistanceKm !== undefined && this.maxDistanceKm > 0);

    // Allow search if there are text filters OR location-based filters
    // If no filters at all, just load all pharmacies
    if (!hasTextFilters && !hasLocationFilter) {
      this.loadAllPharmacies();
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.showAll = false;

    this.pharmacyService.searchPharmacies(
      this.searchQuery?.trim() || undefined,
      this.searchCity?.trim() || undefined,
      this.searchState?.trim() || undefined,
      this.searchZipCode?.trim() || undefined,
      this.userLatitude || undefined,
      this.userLongitude || undefined,
      this.maxDistanceKm && this.maxDistanceKm > 0 ? this.maxDistanceKm : undefined
    ).subscribe({
      next: (data) => {
        this.pharmacies = data;
        this.filteredPharmacies = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        const errorMessage = err.error?.error || err.error?.message || err.message || 'Failed to search pharmacies. Please try again.';
        this.error = errorMessage;
        console.error('Error searching pharmacies:', err);
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchCity = '';
    this.searchState = '';
    this.searchZipCode = '';
    this.maxDistanceKm = null;
    this.loadAllPharmacies();
  }

  viewPharmacyDetails(id: number): void {
    this.router.navigate(['/customer/pharmacies', id]);
  }

  getDirections(latitude: number, longitude: number): void {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  }

  formatOperatingHours(pharmacy: Pharmacy): string {
    if (!pharmacy.operatingHours) return 'Not specified';
    
    const hours = pharmacy.operatingHours;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayKeysPascal = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    let formatted = '';
    dayKeys.forEach((day, index) => {
      const dayHours = (hours as any)[day] || (hours as any)[dayKeysPascal[index]];
      if (dayHours && dayHours.isOpen && dayHours.openTime && dayHours.closeTime) {
        if (formatted) formatted += ', ';
        formatted += `${days[index]}: ${dayHours.openTime} - ${dayHours.closeTime}`;
      }
    });
    
    return formatted || 'Not specified';
  }

  getFullAddress(pharmacy: Pharmacy): string {
    const parts = [
      pharmacy.address,
      pharmacy.city,
      pharmacy.state,
      pharmacy.zipCode
    ].filter(part => part && part.trim());
    
    return parts.join(', ');
  }

  formatDistance(km?: number): string {
    if (!km) return '';
    if (km < 1) {
      return `${Math.round(km * 1000)}m away`;
    }
    return `${km.toFixed(1)}km away`;
  }

  formatStockStatus(medicine: { isAvailable: boolean; quantity: number }): string {
    if (medicine.isAvailable) {
      return `✓ ${medicine.quantity} in stock`;
    }
    return '✗ Out of stock';
  }
}
