export enum UserRole {
  Customer = 1,
  PharmacyOwner = 2,
  Admin = 3
}

export enum ApprovalStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3
}

// Type for role that can be number (enum value) or string (from backend)
export type RoleValue = UserRole | number | string;
// Type for approval status that can be number (enum value) or string (from backend)
export type ApprovalStatusValue = ApprovalStatus | number | string;

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleValue; // Can be number or string from backend
  approvalStatus: ApprovalStatusValue; // Can be number or string from backend
  licenseNumber?: string; // Health ministry license for pharmacy owners
  createdAt?: string; // Optional for backward compatibility
  isActive?: boolean; // User account active status
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  licenseNumber?: string; // Required for PharmacyOwner role
}

export interface UpdateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

