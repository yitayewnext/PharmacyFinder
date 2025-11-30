namespace PharmacyFinder.Core.Entities
{
    public class User : BaseEntity
    {
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // Stored as string in database
        public string ApprovalStatus { get; set; } = "Pending"; // Stored as string in database
        public string? LicenseNumber { get; set; } // Health ministry license for pharmacy owners
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public abstract class BaseEntity
    {
        public int Id { get; set; }
    }
}