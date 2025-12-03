using Microsoft.EntityFrameworkCore;
using PharmacyFinder.Application.Interfaces;
using PharmacyFinder.Core.DTOs;
using PharmacyFinder.Core.Entities;
using PharmacyFinder.Core.Enums;
using PharmacyFinder.Core.Helpers;
using PharmacyFinder.Infrastructure.Data;

namespace PharmacyFinder.Application.Services
{
    public class MedicineService : IMedicineService
    {
        private readonly ApplicationDbContext _context;

        public MedicineService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<MedicineDto> AddMedicineAsync(int pharmacyId, CreateMedicineDto medicineDto, int userId)
        {
            var pharmacy = await _context.Pharmacies.FirstOrDefaultAsync(p => p.Id == pharmacyId && p.IsActive);
            if (pharmacy == null)
            {
                throw new ArgumentException("Pharmacy not found");
            }

            if (pharmacy.OwnerId != userId)
            {
                throw new UnauthorizedAccessException("You are not the owner of this pharmacy");
            }

            var medicine = new Medicine
            {
                Name = medicineDto.Name,
                Description = medicineDto.Description,
                Manufacturer = medicineDto.Manufacturer,
                Price = medicineDto.Price,
                Quantity = medicineDto.Quantity,
                ExpiryDate = medicineDto.ExpiryDate,
                IsPrescriptionRequired = medicineDto.IsPrescriptionRequired,
                Category = medicineDto.Category,
                PharmacyId = pharmacyId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Medicines.Add(medicine);
            await _context.SaveChangesAsync();

            return MapToDto(medicine);
        }

        public async Task<MedicineDto> UpdateMedicineAsync(int medicineId, UpdateMedicineDto medicineDto, int userId)
        {
            var medicine = await _context.Medicines
                .Include(m => m.Pharmacy)
                .FirstOrDefaultAsync(m => m.Id == medicineId);

            if (medicine == null)
            {
                throw new ArgumentException("Medicine not found");
            }

            if (medicine.Pharmacy!.OwnerId != userId)
            {
                throw new UnauthorizedAccessException("You are not the owner of this pharmacy");
            }

            if (medicineDto.Name != null) medicine.Name = medicineDto.Name;
            if (medicineDto.Description != null) medicine.Description = medicineDto.Description;
            if (medicineDto.Manufacturer != null) medicine.Manufacturer = medicineDto.Manufacturer;
            if (medicineDto.Price.HasValue) medicine.Price = medicineDto.Price.Value;
            if (medicineDto.Quantity.HasValue) medicine.Quantity = medicineDto.Quantity.Value;
            if (medicineDto.ExpiryDate.HasValue) medicine.ExpiryDate = medicineDto.ExpiryDate.Value;
            if (medicineDto.IsPrescriptionRequired.HasValue) medicine.IsPrescriptionRequired = medicineDto.IsPrescriptionRequired.Value;
            if (medicineDto.Category != null) medicine.Category = medicineDto.Category;

            medicine.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(medicine);
        }

        public async Task DeleteMedicineAsync(int medicineId, int userId)
        {
            var medicine = await _context.Medicines
                .Include(m => m.Pharmacy)
                .FirstOrDefaultAsync(m => m.Id == medicineId);

            if (medicine == null)
            {
                throw new ArgumentException("Medicine not found");
            }

            if (medicine.Pharmacy!.OwnerId != userId)
            {
                throw new UnauthorizedAccessException("You are not the owner of this pharmacy");
            }

            _context.Medicines.Remove(medicine);
            await _context.SaveChangesAsync();
        }

        public async Task<MedicineDto?> GetMedicineByIdAsync(int medicineId)
        {
            var medicine = await _context.Medicines
                .FirstOrDefaultAsync(m => m.Id == medicineId);

            return medicine == null ? null : MapToDto(medicine);
        }

        public async Task<List<MedicineDto>> GetMedicinesByPharmacyIdAsync(int pharmacyId)
        {
            var medicines = await _context.Medicines
                .Where(m => m.PharmacyId == pharmacyId)
                .OrderBy(m => m.Name)
                .ToListAsync();

            return medicines.Select(MapToDto).ToList();
        }

        public async Task<List<MedicineDto>> SearchMedicinesAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return new List<MedicineDto>();
            }

            var lowerQuery = query.ToLower();
            var medicines = await _context.Medicines
                .Where(m => m.Name.ToLower().Contains(lowerQuery) || 
                            m.Description.ToLower().Contains(lowerQuery) ||
                            m.Category.ToLower().Contains(lowerQuery))
                .OrderBy(m => m.Name)
                .ToListAsync();

            return medicines.Select(MapToDto).ToList();
        }

        public async Task<List<MedicineSearchResultDto>> SearchMedicinesWithPharmacyAsync(
            string query,
            double? userLatitude,
            double? userLongitude,
            bool? availableOnly,
            decimal? minPrice,
            decimal? maxPrice,
            string? category,
            double? maxDistanceKm)
        {
            // Get medicines from approved pharmacies only
            var medicineQuery = _context.Medicines
                .Include(m => m.Pharmacy)
                .Where(m => m.Pharmacy != null &&
                           m.Pharmacy.IsActive &&
                           m.Pharmacy.ApprovalStatus == ApprovalStatusHelper.ApprovalStatusToString(ApprovalStatus.Approved) &&
                           m.ExpiryDate > DateTime.UtcNow);

            // Apply search query filter only if query is provided
            if (!string.IsNullOrWhiteSpace(query))
            {
                var lowerQuery = query.ToLower();
                medicineQuery = medicineQuery.Where(m =>
                    m.Name.ToLower().Contains(lowerQuery) ||
                    m.Description.ToLower().Contains(lowerQuery) ||
                    m.Category.ToLower().Contains(lowerQuery));
            }

            // Apply filters
            if (availableOnly == true)
            {
                medicineQuery = medicineQuery.Where(m => m.Quantity > 0);
            }

            if (minPrice.HasValue)
            {
                medicineQuery = medicineQuery.Where(m => m.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                medicineQuery = medicineQuery.Where(m => m.Price <= maxPrice.Value);
            }

            if (!string.IsNullOrWhiteSpace(category))
            {
                var categoryLower = category.ToLower();
                medicineQuery = medicineQuery.Where(m => m.Category.ToLower().Contains(categoryLower));
            }

            var medicines = await medicineQuery.ToListAsync();
            var result = new List<MedicineSearchResultDto>();

            foreach (var medicine in medicines)
            {
                if (medicine.Pharmacy == null) continue;

                var searchResult = new MedicineSearchResultDto
                {
                    Id = medicine.Id,
                    Name = medicine.Name,
                    Description = medicine.Description,
                    Manufacturer = medicine.Manufacturer,
                    Price = medicine.Price,
                    Quantity = medicine.Quantity,
                    ExpiryDate = medicine.ExpiryDate,
                    IsPrescriptionRequired = medicine.IsPrescriptionRequired,
                    Category = medicine.Category,
                    PharmacyId = medicine.PharmacyId,
                    PharmacyName = medicine.Pharmacy.Name,
                    PharmacyAddress = medicine.Pharmacy.Address,
                    PharmacyCity = medicine.Pharmacy.City,
                    PharmacyState = medicine.Pharmacy.State,
                    PharmacyPhoneNumber = medicine.Pharmacy.PhoneNumber,
                    PharmacyLatitude = medicine.Pharmacy.Latitude,
                    PharmacyLongitude = medicine.Pharmacy.Longitude,
                    CreatedAt = medicine.CreatedAt
                };

                // Calculate distance if user coordinates provided
                if (userLatitude.HasValue && userLongitude.HasValue)
                {
                    searchResult.DistanceInKm = CalculateDistance(
                        userLatitude.Value,
                        userLongitude.Value,
                        medicine.Pharmacy.Latitude,
                        medicine.Pharmacy.Longitude);
                }

                // Apply distance filter if specified
                if (maxDistanceKm.HasValue && searchResult.DistanceInKm.HasValue)
                {
                    if (searchResult.DistanceInKm.Value > maxDistanceKm.Value)
                    {
                        continue; // Skip this medicine
                    }
                }

                result.Add(searchResult);
            }

            // Sort by price (lowest first), then by distance if available
            if (userLatitude.HasValue && userLongitude.HasValue)
            {
                result = result.OrderBy(m => m.Price)
                              .ThenBy(m => m.DistanceInKm ?? double.MaxValue)
                              .ToList();
            }
            else
            {
                result = result.OrderBy(m => m.Price).ToList();
            }

            return result;
        }

        /// <summary>
        /// Calculate distance between two coordinates using Haversine formula
        /// Returns distance in kilometers
        /// </summary>
        private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double earthRadiusKm = 6371.0;

            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return earthRadiusKm * c;
        }

        private static double ToRadians(double degrees)
        {
            return degrees * (Math.PI / 180.0);
        }

        private static MedicineDto MapToDto(Medicine medicine)
        {
            return new MedicineDto
            {
                Id = medicine.Id,
                Name = medicine.Name,
                Description = medicine.Description,
                Manufacturer = medicine.Manufacturer,
                Price = medicine.Price,
                Quantity = medicine.Quantity,
                ExpiryDate = medicine.ExpiryDate,
                IsPrescriptionRequired = medicine.IsPrescriptionRequired,
                Category = medicine.Category,
                PharmacyId = medicine.PharmacyId,
                CreatedAt = medicine.CreatedAt,
                UpdatedAt = medicine.UpdatedAt
            };
        }
    }
}
