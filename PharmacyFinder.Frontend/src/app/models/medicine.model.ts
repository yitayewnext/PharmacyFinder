export interface Medicine {
    id: number;
    name: string;
    description: string;
    manufacturer: string;
    price: number;
    quantity: number;
    expiryDate: Date;
    isPrescriptionRequired: boolean;
    category: string;
    pharmacyId: number;
    createdAt: Date;
    updatedAt?: Date;
    // Optional pharmacy information (for matched medicines in prescriptions)
    pharmacyName?: string;
    pharmacyAddress?: string;
    pharmacyPhoneNumber?: string;
}

export interface CreateMedicine {
    name: string;
    description: string;
    manufacturer: string;
    price: number;
    quantity: number;
    expiryDate: Date;
    isPrescriptionRequired: boolean;
    category: string;
}

export interface UpdateMedicine {
    name?: string;
    description?: string;
    manufacturer?: string;
    price?: number;
    quantity?: number;
    expiryDate?: Date;
    isPrescriptionRequired?: boolean;
    category?: string;
}

export interface MedicineSearchResult {
    id: number;
    name: string;
    description: string;
    manufacturer: string;
    price: number;
    quantity: number;
    isAvailable: boolean;
    expiryDate: Date;
    isPrescriptionRequired: boolean;
    category: string;
    pharmacyId: number;
    pharmacyName: string;
    pharmacyAddress: string;
    pharmacyCity: string;
    pharmacyState: string;
    pharmacyPhoneNumber: string;
    pharmacyLatitude: number;
    pharmacyLongitude: number;
    distanceInKm?: number;
    createdAt: Date;
}