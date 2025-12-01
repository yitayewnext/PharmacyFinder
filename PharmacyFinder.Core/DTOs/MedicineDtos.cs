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
}
