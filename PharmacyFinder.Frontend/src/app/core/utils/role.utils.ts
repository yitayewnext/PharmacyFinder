import { UserRole, RoleValue } from '../../models/user.model';

/**
 * Gets the display name for a user role
 * @param role - The role number, string, or UserRole enum value
 * @returns The formatted role name
 */
export function getRoleName(role: RoleValue | undefined | null): string {
  if (role === undefined || role === null) return '';
  
  // If it's already a string, check if it's a valid role name
  if (typeof role === 'string') {
    // Handle string values from backend
    const roleMap: { [key: string]: string } = {
      'Customer': 'Customer',
      'PharmacyOwner': 'Pharmacy Owner',
      'Pharmacy Owner': 'Pharmacy Owner',
      'Admin': 'Admin'
    };
    
    if (roleMap[role]) {
      return roleMap[role];
    }
    
    // Try to parse as number string
    const numRole = parseInt(role, 10);
    if (!isNaN(numRole)) {
      role = numRole;
    } else {
      return role; // Return as-is if not recognized
    }
  }
  
  // Handle number/enum values
  const roleNumber = typeof role === 'number' ? role : role;
  const roleNames: { [key: number]: string } = {
    [UserRole.Customer]: 'Customer',
    [UserRole.PharmacyOwner]: 'Pharmacy Owner',
    [UserRole.Admin]: 'Admin'
  };
  
  return roleNames[roleNumber] || '';
}

/**
 * Gets the role enum value from a number or string
 * @param value - The role value (number or string)
 * @returns The UserRole enum value
 */
export function getRoleEnum(value: RoleValue | undefined | null): UserRole | null {
  if (value === undefined || value === null) return null;
  
  if (typeof value === 'number') {
    return value as UserRole;
  }
  
  // Handle string values (from backend JSON serialization)
  const roleMap: { [key: string]: UserRole } = {
    'Customer': UserRole.Customer,
    'PharmacyOwner': UserRole.PharmacyOwner,
    'Pharmacy Owner': UserRole.PharmacyOwner,
    'Admin': UserRole.Admin,
    '1': UserRole.Customer,
    '2': UserRole.PharmacyOwner,
    '3': UserRole.Admin
  };
  
  if (typeof value === 'string' && roleMap[value]) {
    return roleMap[value];
  }
  
  // Try parsing as number
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  if (!isNaN(numValue as number)) {
    return numValue as UserRole;
  }
  
  return null;
}

