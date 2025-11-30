using PharmacyFinder.Core.Enums;

namespace PharmacyFinder.Core.Helpers
{
    public static class RoleHelper
    {
        /// <summary>
        /// Converts UserRole enum to string for database storage
        /// </summary>
        public static string RoleToString(UserRole role)
        {
            return role switch
            {
                UserRole.Customer => "Customer",
                UserRole.PharmacyOwner => "PharmacyOwner",
                UserRole.Admin => "Admin",
                _ => throw new ArgumentException($"Unknown role: {role}")
            };
        }

        /// <summary>
        /// Converts string role from database to UserRole enum
        /// </summary>
        public static UserRole StringToRole(string role)
        {
            return role switch
            {
                "Customer" => UserRole.Customer,
                "PharmacyOwner" => UserRole.PharmacyOwner,
                "Admin" => UserRole.Admin,
                _ => throw new ArgumentException($"Unknown role string: {role}")
            };
        }

        /// <summary>
        /// Gets display name for a role string
        /// </summary>
        public static string GetDisplayName(string role)
        {
            return role switch
            {
                "Customer" => "Customer",
                "PharmacyOwner" => "Pharmacy Owner",
                "Admin" => "Admin",
                _ => role
            };
        }
    }

    public static class ApprovalStatusHelper
    {
        /// <summary>
        /// Converts ApprovalStatus enum to string for database storage
        /// </summary>
        public static string ApprovalStatusToString(ApprovalStatus status)
        {
            return status switch
            {
                ApprovalStatus.Pending => "Pending",
                ApprovalStatus.Approved => "Approved",
                ApprovalStatus.Rejected => "Rejected",
                _ => throw new ArgumentException($"Unknown approval status: {status}")
            };
        }

        /// <summary>
        /// Converts string approval status from database to ApprovalStatus enum
        /// </summary>
        public static ApprovalStatus StringToApprovalStatus(string status)
        {
            return status switch
            {
                "Pending" => ApprovalStatus.Pending,
                "Approved" => ApprovalStatus.Approved,
                "Rejected" => ApprovalStatus.Rejected,
                _ => throw new ArgumentException($"Unknown approval status string: {status}")
            };
        }

        /// <summary>
        /// Gets display name for an approval status string
        /// </summary>
        public static string GetDisplayName(string status)
        {
            return status switch
            {
                "Pending" => "Pending",
                "Approved" => "Approved",
                "Rejected" => "Rejected",
                _ => status
            };
        }
    }
}

