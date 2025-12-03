import { ApprovalStatus, ApprovalStatusValue } from './user.model';

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  isOpen: boolean;
  openTime?: string; // Format: "HH:mm" (e.g., "09:00")
  closeTime?: string; // Format: "HH:mm" (e.g., "17:00")
}

export interface Pharmacy {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  licenseNumber: string;
  businessLicense: string;
  latitude: number;
  longitude: number;
  operatingHours: OperatingHours;
  approvalStatus: ApprovalStatusValue;
  ownerId: number;
  ownerName?: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  isActive: boolean;
}

export interface RegisterPharmacyRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  licenseNumber: string;
  businessLicense: string;
  latitude: number;
  longitude: number;
  operatingHours: OperatingHours;
}

export interface UpdatePharmacyApprovalRequest {
  approvalStatus: ApprovalStatus;
}

export interface PharmacySearchResult extends Pharmacy {
  distanceInKm?: number;
  matchingMedicines?: PharmacyMedicine[];
}

export interface PharmacyMedicine {
  id: number;
  name: string;
  price: number;
  quantity: number;
  isAvailable: boolean;
}

