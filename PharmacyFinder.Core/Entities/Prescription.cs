namespace PharmacyFinder.Core.Entities
{
    public class Prescription : BaseEntity
    {
        public int CustomerId { get; set; }
        public User? Customer { get; set; }
        
        public string ImageUrl { get; set; } = string.Empty; // Path to stored image
        public string? ExtractedText { get; set; } // Extracted text from prescription
        public string? Status { get; set; } = "Pending"; // Pending, Processed, Failed
        
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }
        
        // Navigation property for related prescription medicines
        public ICollection<PrescriptionMedicine> Medicines { get; set; } = new List<PrescriptionMedicine>();
    }
}

