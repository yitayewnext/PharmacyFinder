using PharmacyFinder.Core.DTOs;

namespace PharmacyFinder.Application.Interfaces
{
    public interface IPharmacyService
    {
        Task<PharmacyDto> RegisterPharmacyAsync(RegisterPharmacyDto request, int ownerId);
        Task<PharmacyDto?> GetPharmacyByIdAsync(int id);
        Task<List<PharmacyDto>> GetPharmaciesByOwnerIdAsync(int ownerId);
        Task<List<PharmacyDto>> GetPendingPharmaciesAsync();
        Task<List<PharmacyDto>> GetAllPharmaciesAsync();
        Task<PharmacyDto> UpdatePharmacyApprovalAsync(int pharmacyId, UpdatePharmacyApprovalDto request, int adminId);
        Task<PharmacyDto> UpdatePharmacyAsync(int pharmacyId, UpdatePharmacyDto request, int adminId);
        Task<bool> DeletePharmacyAsync(int pharmacyId, int adminId);
        Task<List<PharmacySearchResultDto>> SearchPharmaciesAsync(
            string? searchQuery, 
            string? city, 
            string? state, 
            string? zipCode,
            double? userLatitude = null,
            double? userLongitude = null,
            double? maxDistanceKm = null);
        Task<List<PharmacySearchResultDto>> SearchPharmaciesByMedicineAsync(
            string? medicineName,
            double? userLatitude,
            double? userLongitude,
            bool? availableOnly,
            decimal? maxPrice,
            double? maxDistanceKm);
    }
}

