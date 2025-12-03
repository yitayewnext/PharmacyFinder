using System.ComponentModel.DataAnnotations;

namespace PharmacyFinder.Core.DTOs
{
    public class MedicineDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Manufacturer { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public DateTime ExpiryDate { get; set; }
        public bool IsPrescriptionRequired { get; set; }
        public string Category { get; set; } = string.Empty;
        public int PharmacyId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        // Optional pharmacy information (for matched medicines in prescriptions)
        public string? PharmacyName { get; set; }
        public string? PharmacyAddress { get; set; }
        public string? PharmacyPhoneNumber { get; set; }
    }

    public class CreateMedicineDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Manufacturer { get; set; } = string.Empty;

        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }

        [Range(0, int.MaxValue)]
        public int Quantity { get; set; }

        public DateTime ExpiryDate { get; set; }

        public bool IsPrescriptionRequired { get; set; }

        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;
    }

    public class UpdateMedicineDto
    {
        [MaxLength(100)]
        public string? Name { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(100)]
        public string? Manufacturer { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? Price { get; set; }

        [Range(0, int.MaxValue)]
        public int? Quantity { get; set; }

        public DateTime? ExpiryDate { get; set; }

        public bool? IsPrescriptionRequired { get; set; }

        [MaxLength(50)]
        public string? Category { get; set; }
    }

    public class MedicineSearchResultDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Manufacturer { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public bool IsAvailable => Quantity > 0;
        public DateTime ExpiryDate { get; set; }
        public bool IsPrescriptionRequired { get; set; }
        public string Category { get; set; } = string.Empty;
        public int PharmacyId { get; set; }
        public string PharmacyName { get; set; } = string.Empty;
        public string PharmacyAddress { get; set; } = string.Empty;
        public string PharmacyCity { get; set; } = string.Empty;
        public string PharmacyState { get; set; } = string.Empty;
        public string PharmacyPhoneNumber { get; set; } = string.Empty;
        public double PharmacyLatitude { get; set; }
        public double PharmacyLongitude { get; set; }
        public double? DistanceInKm { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
