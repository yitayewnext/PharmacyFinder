import { ApprovalStatus, ApprovalStatusValue } from '../../models/user.model';

/**
 * Gets the display name for an approval status
 * @param status - The approval status number, string, or ApprovalStatus enum value
 * @returns The formatted approval status name
 */
export function getApprovalStatusName(status: ApprovalStatusValue | undefined | null): string {
  if (status === undefined || status === null) return '';
  
  // If it's already a string, check if it's a valid status name
  if (typeof status === 'string') {
    // Handle string values from backend
    const statusMap: { [key: string]: string } = {
      'Pending': 'Pending',
      'Approved': 'Approved',
      'Rejected': 'Rejected'
    };
    
    if (statusMap[status]) {
      return statusMap[status];
    }
    
    // Try to parse as number string
    const numStatus = parseInt(status, 10);
    if (!isNaN(numStatus)) {
      status = numStatus;
    } else {
      return status; // Return as-is if not recognized
    }
  }
  
  // Handle number/enum values
  const statusNumber = typeof status === 'number' ? status : status;
  const statusNames: { [key: number]: string } = {
    [ApprovalStatus.Pending]: 'Pending',
    [ApprovalStatus.Approved]: 'Approved',
    [ApprovalStatus.Rejected]: 'Rejected'
  };
  
  return statusNames[statusNumber] || '';
}

/**
 * Gets the CSS class for approval status badge styling
 * @param status - The approval status value
 * @returns CSS class name
 */
export function getApprovalStatusClass(status: ApprovalStatusValue | undefined | null): string {
  const statusName = getApprovalStatusName(status).toLowerCase();
  return statusName;
}

/**
 * Converts approval status value to ApprovalStatus enum
 * @param status - The approval status value (number, string, or enum)
 * @returns ApprovalStatus enum value
 */
export function getApprovalStatusEnum(status: ApprovalStatusValue | undefined | null): ApprovalStatus {
  if (status === undefined || status === null) return ApprovalStatus.Pending;
  
  // If it's already a number/enum, return it
  if (typeof status === 'number') {
    return status as ApprovalStatus;
  }
  
  // If it's a string, convert it
  if (typeof status === 'string') {
    const statusMap: { [key: string]: ApprovalStatus } = {
      'pending': ApprovalStatus.Pending,
      'approved': ApprovalStatus.Approved,
      'rejected': ApprovalStatus.Rejected,
      'Pending': ApprovalStatus.Pending,
      'Approved': ApprovalStatus.Approved,
      'Rejected': ApprovalStatus.Rejected
    };
    
    const lowerStatus = status.toLowerCase();
    if (statusMap[lowerStatus]) {
      return statusMap[lowerStatus];
    }
    
    // Try to parse as number string
    const numStatus = parseInt(status, 10);
    if (!isNaN(numStatus)) {
      return numStatus as ApprovalStatus;
    }
  }
  
  return ApprovalStatus.Pending;
}

