using Microsoft.AspNetCore.Http;
using PharmacyFinder.Core.DTOs;

namespace PharmacyFinder.Application.Interfaces
{
    public interface IPrescriptionService
    {
        Task<PrescriptionDto> UploadPrescriptionAsync(int customerId, IFormFile imageFile, string uploadPath, string? extractedText = null);
        Task<PrescriptionDto> GetPrescriptionByIdAsync(int prescriptionId, int userId);
        Task<List<PrescriptionDto>> GetCustomerPrescriptionsAsync(int customerId);
        Task<ExtractMedicinesResponse> ExtractMedicinesFromTextAsync(string extractedText);
        Task<PrescriptionDto> ProcessPrescriptionAsync(int prescriptionId, int userId);
    }
}

