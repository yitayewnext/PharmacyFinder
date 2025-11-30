namespace PharmacyFinder.Core.Entities
{
    public class Pharmacy : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string LicenseNumber { get; set; } = string.Empty;
        public string BusinessLicense { get; set; } = string.Empty;
        
        // Location coordinates for distance calculation
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        
        // Operating hours (stored as JSON string)
        public string OperatingHours { get; set; } = string.Empty;
        
        // Approval system
        public string ApprovalStatus { get; set; } = "Pending"; // Pending, Approved, Rejected
        public int OwnerId { get; set; } // Foreign key to User
        public User? Owner { get; set; }
        
        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public int? ApprovedBy { get; set; } // Admin user ID who approved
        public bool IsActive { get; set; } = true;
    }
}



