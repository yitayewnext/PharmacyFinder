using PharmacyFinder.Core.DTOs;

namespace PharmacyFinder.Application.Interfaces
{
    public interface IMedicineService
    {
        Task<MedicineDto> AddMedicineAsync(int pharmacyId, CreateMedicineDto medicineDto, int userId);
        Task<MedicineDto> UpdateMedicineAsync(int medicineId, UpdateMedicineDto medicineDto, int userId);
        Task DeleteMedicineAsync(int medicineId, int userId);
        Task<MedicineDto?> GetMedicineByIdAsync(int medicineId);
        Task<List<MedicineDto>> GetMedicinesByPharmacyIdAsync(int pharmacyId);
        Task<List<MedicineDto>> SearchMedicinesAsync(string query);
    }
}
