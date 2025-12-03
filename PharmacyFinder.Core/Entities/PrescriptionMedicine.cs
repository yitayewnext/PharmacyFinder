namespace PharmacyFinder.Core.Entities
{
    public class PrescriptionMedicine : BaseEntity
    {
        public int PrescriptionId { get; set; }
        public Prescription? Prescription { get; set; }
        
        public string MedicineName { get; set; } = string.Empty; // Extracted medicine name
        public string? Dosage { get; set; } // Extracted dosage information
        public string? Frequency { get; set; } // Extracted frequency
        public string? Duration { get; set; } // Extracted duration
        public string? Quantity { get; set; } // Extracted quantity
        
        public int? MatchedMedicineId { get; set; } // ID of matched medicine if found
        public Medicine? MatchedMedicine { get; set; }
        
        public bool IsAvailable { get; set; } // Whether medicine is available in system
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

