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
