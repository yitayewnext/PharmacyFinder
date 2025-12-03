namespace PharmacyFinder.Core.DTOs
{
    public class PrescriptionDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string? ExtractedText { get; set; }
        public string? Status { get; set; }
        public DateTime UploadedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public List<PrescriptionMedicineDto>? Medicines { get; set; }
    }

    public class PrescriptionMedicineDto
    {
        public int Id { get; set; }
        public int PrescriptionId { get; set; }
        public string MedicineName { get; set; } = string.Empty;
        public string? Dosage { get; set; }
        public string? Frequency { get; set; }
        public string? Duration { get; set; }
        public string? Quantity { get; set; }
        public int? MatchedMedicineId { get; set; }
        public MedicineDto? MatchedMedicine { get; set; }
        public bool IsAvailable { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ExtractMedicinesResponse
    {
        public string ExtractedText { get; set; } = string.Empty;
        public List<ExtractedMedicineDto> Medicines { get; set; } = new();
    }

    public class ExtractedMedicineDto
    {
        public string MedicineName { get; set; } = string.Empty;
        public string? Dosage { get; set; }
        public string? Frequency { get; set; }
        public string? Duration { get; set; }
        public string? Quantity { get; set; }
    }

    public class ExtractTextRequest
    {
        public string Text { get; set; } = string.Empty;
    }
}

