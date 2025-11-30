using PharmacyFinder.Core.Enums;

namespace PharmacyFinder.Core.DTOs
{
    public class RegisterPharmacyDto
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string LicenseNumber { get; set; } = string.Empty; // Will be inherited from owner, but kept for backward compatibility
        public string BusinessLicense { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public OperatingHoursDto OperatingHours { get; set; } = new OperatingHoursDto();
    }

    public class OperatingHoursDto
    {
        public DayHoursDto Monday { get; set; } = new DayHoursDto();
        public DayHoursDto Tuesday { get; set; } = new DayHoursDto();
        public DayHoursDto Wednesday { get; set; } = new DayHoursDto();
        public DayHoursDto Thursday { get; set; } = new DayHoursDto();
        public DayHoursDto Friday { get; set; } = new DayHoursDto();
        public DayHoursDto Saturday { get; set; } = new DayHoursDto();
        public DayHoursDto Sunday { get; set; } = new DayHoursDto();
    }

    public class DayHoursDto
    {
        public bool IsOpen { get; set; }
        public string? OpenTime { get; set; } // Format: "HH:mm" (e.g., "09:00")
        public string? CloseTime { get; set; } // Format: "HH:mm" (e.g., "17:00")
    }

    public class PharmacyDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string ZipCode { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string LicenseNumber { get; set; } = string.Empty;
        public string BusinessLicense { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public OperatingHoursDto OperatingHours { get; set; } = new OperatingHoursDto();
        public ApprovalStatus ApprovalStatus { get; set; }
        public int OwnerId { get; set; }
        public string? OwnerName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdatePharmacyApprovalDto
    {
        public ApprovalStatus ApprovalStatus { get; set; }
    }

    public class UpdatePharmacyDto
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
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public OperatingHoursDto OperatingHours { get; set; } = new OperatingHoursDto();
    }
}

