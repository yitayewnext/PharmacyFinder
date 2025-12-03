export interface Prescription {
  id: number;
  customerId: number;
  imageUrl: string;
  extractedText?: string;
  status?: string;
  uploadedAt: Date;
  processedAt?: Date;
  medicines?: PrescriptionMedicine[];
}

export interface PrescriptionMedicine {
  id: number;
  prescriptionId: number;
  medicineName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: string;
  matchedMedicineId?: number;
  matchedMedicine?: any; // Medicine interface
  isAvailable: boolean;
  createdAt: Date;
}

export interface ExtractMedicinesResponse {
  extractedText: string;
  medicines: ExtractedMedicine[];
}

export interface ExtractedMedicine {
  medicineName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: string;
}

