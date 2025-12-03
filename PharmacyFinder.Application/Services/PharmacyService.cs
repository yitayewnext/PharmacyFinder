using PharmacyFinder.Application.Interfaces;
using PharmacyFinder.Core.DTOs;
using PharmacyFinder.Core.Entities;
using PharmacyFinder.Core.Enums;
using PharmacyFinder.Core.Helpers;
using PharmacyFinder.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace PharmacyFinder.Application.Services
{
    public class PharmacyService : IPharmacyService
    {
        private readonly ApplicationDbContext _context;

        public PharmacyService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PharmacyDto> RegisterPharmacyAsync(RegisterPharmacyDto request, int ownerId)
        {
            // Validate owner exists and is a pharmacy owner
            var owner = await _context.Users.FindAsync(ownerId);
            if (owner == null)
            {
                throw new ArgumentException("Owner not found");
            }

            if (RoleHelper.StringToRole(owner.Role) != UserRole.PharmacyOwner)
            {
                throw new UnauthorizedAccessException("Only pharmacy owners can register pharmacies");
            }

            // Check if owner already has a pharmacy - REMOVED to allow multiple pharmacies
            // var existingPharmacy = await _context.Pharmacies
            //     .FirstOrDefaultAsync(p => p.OwnerId == ownerId && p.IsActive);
            
            // if (existingPharmacy != null)
            // {
            //     throw new InvalidOperationException("You already have a registered pharmacy");
            // }

            // Use owner's license number (Health Ministry License) for the pharmacy
            if (string.IsNullOrWhiteSpace(owner.LicenseNumber))
            {
                throw new ArgumentException("Pharmacy owner must have a valid license number. Please update your account.");
            }

            // Validate license number uniqueness (check if this owner's license is already used by another pharmacy)
            if (await _context.Pharmacies.AnyAsync(p => p.LicenseNumber == owner.LicenseNumber && p.OwnerId != ownerId && p.IsActive))
            {
                throw new ArgumentException("This license number is already registered to another pharmacy");
            }

            // Serialize operating hours
            var operatingHoursJson = JsonSerializer.Serialize(request.OperatingHours);

            var pharmacy = new Pharmacy
            {
                Name = request.Name,
                Address = request.Address,
                City = request.City,
                State = request.State,
                ZipCode = request.ZipCode,
                PhoneNumber = request.PhoneNumber,
                Email = request.Email,
                LicenseNumber = owner.LicenseNumber, // Inherit from owner's account
                BusinessLicense = request.BusinessLicense,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                OperatingHours = operatingHoursJson,
                OwnerId = ownerId,
                ApprovalStatus = ApprovalStatusHelper.ApprovalStatusToString(ApprovalStatus.Pending),
                IsActive = true
            };

            _context.Pharmacies.Add(pharmacy);
            await _context.SaveChangesAsync();

            return await MapToDtoAsync(pharmacy);
        }

        public async Task<PharmacyDto?> GetPharmacyByIdAsync(int id)
        {
            var pharmacy = await _context.Pharmacies
                .Include(p => p.Owner)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

            return pharmacy == null ? null : await MapToDtoAsync(pharmacy);
        }

        public async Task<List<PharmacyDto>> GetPharmaciesByOwnerIdAsync(int ownerId)
        {
            var pharmacies = await _context.Pharmacies
                .Include(p => p.Owner)
                .Where(p => p.OwnerId == ownerId && p.IsActive)
                .ToListAsync();

            var result = new List<PharmacyDto>();
            foreach (var pharmacy in pharmacies)
            {
                result.Add(await MapToDtoAsync(pharmacy));
            }
            return result;
        }

        public async Task<List<PharmacyDto>> GetPendingPharmaciesAsync()
        {
            var pharmacies = await _context.Pharmacies
                .Include(p => p.Owner)
                .Where(p => p.ApprovalStatus == ApprovalStatusHelper.ApprovalStatusToString(ApprovalStatus.Pending) && p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var result = new List<PharmacyDto>();
            foreach (var pharmacy in pharmacies)
            {
                result.Add(await MapToDtoAsync(pharmacy));
            }
            return result;
        }

        public async Task<List<PharmacyDto>> GetAllPharmaciesAsync()
        {
            var pharmacies = await _context.Pharmacies
                .Include(p => p.Owner)
                .Where(p => p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var result = new List<PharmacyDto>();
            foreach (var pharmacy in pharmacies)
            {
                result.Add(await MapToDtoAsync(pharmacy));
            }
            return result;
        }

        public async Task<PharmacyDto> UpdatePharmacyApprovalAsync(int pharmacyId, UpdatePharmacyApprovalDto request, int adminId)
        {
            var pharmacy = await _context.Pharmacies
                .Include(p => p.Owner)
                .FirstOrDefaultAsync(p => p.Id == pharmacyId && p.IsActive);

            if (pharmacy == null)
            {
                throw new ArgumentException("Pharmacy not found");
            }

            pharmacy.ApprovalStatus = ApprovalStatusHelper.ApprovalStatusToString(request.ApprovalStatus);
            pharmacy.UpdatedAt = DateTime.UtcNow;
            
            if (request.ApprovalStatus == ApprovalStatus.Approved)
            {
                pharmacy.ApprovedAt = DateTime.UtcNow;
                pharmacy.ApprovedBy = adminId;
            }

            await _context.SaveChangesAsync();

            return await MapToDtoAsync(pharmacy);
        }

        public async Task<PharmacyDto> UpdatePharmacyAsync(int pharmacyId, UpdatePharmacyDto request, int adminId)
        {
            var pharmacy = await _context.Pharmacies
                .Include(p => p.Owner)
                .FirstOrDefaultAsync(p => p.Id == pharmacyId && p.IsActive);

            if (pharmacy == null)
            {
                throw new ArgumentException("Pharmacy not found");
            }

            // Validate license number uniqueness (if changed)
            if (pharmacy.LicenseNumber != request.LicenseNumber)
            {
                if (await _context.Pharmacies.AnyAsync(p => p.LicenseNumber == request.LicenseNumber && p.Id != pharmacyId && p.IsActive))
                {
                    throw new ArgumentException("License number already exists");
                }
            }

            // Serialize operating hours
            var operatingHoursJson = JsonSerializer.Serialize(request.OperatingHours);

            pharmacy.Name = request.Name;
            pharmacy.Address = request.Address;
            pharmacy.City = request.City;
            pharmacy.State = request.State;
            pharmacy.ZipCode = request.ZipCode;
            pharmacy.PhoneNumber = request.PhoneNumber;
            pharmacy.Email = request.Email;
            pharmacy.LicenseNumber = request.LicenseNumber;
            pharmacy.BusinessLicense = request.BusinessLicense;
            pharmacy.Latitude = request.Latitude;
            pharmacy.Longitude = request.Longitude;
            pharmacy.OperatingHours = operatingHoursJson;
            pharmacy.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await MapToDtoAsync(pharmacy);
        }

        public async Task<bool> DeletePharmacyAsync(int pharmacyId, int adminId)
        {
            var pharmacy = await _context.Pharmacies.FindAsync(pharmacyId);

            if (pharmacy == null)
            {
                throw new ArgumentException("Pharmacy not found");
            }

            // Soft delete
            pharmacy.IsActive = false;
            pharmacy.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<PharmacySearchResultDto>> SearchPharmaciesAsync(
            string? searchQuery, 
            string? city, 
            string? state, 
            string? zipCode,
            double? userLatitude = null,
            double? userLongitude = null,
            double? maxDistanceKm = null)
        {
            // Normalize empty strings to null
            searchQuery = string.IsNullOrWhiteSpace(searchQuery) ? null : searchQuery;
            city = string.IsNullOrWhiteSpace(city) ? null : city;
            state = string.IsNullOrWhiteSpace(state) ? null : state;
            zipCode = string.IsNullOrWhiteSpace(zipCode) ? null : zipCode;

            var pharmacyQuery = _context.Pharmacies
                .Include(p => p.Owner)
                .Where(p => p.IsActive && 
                           p.ApprovalStatus == ApprovalStatusHelper.ApprovalStatusToString(ApprovalStatus.Approved));

            // Search by name, address, or license number
            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                var searchLower = searchQuery.ToLower();
                pharmacyQuery = pharmacyQuery.Where(p => 
                    p.Name.ToLower().Contains(searchLower) ||
                    p.Address.ToLower().Contains(searchLower) ||
                    p.LicenseNumber.ToLower().Contains(searchLower));
            }

            // Filter by city
            if (!string.IsNullOrWhiteSpace(city))
            {
                pharmacyQuery = pharmacyQuery.Where(p => p.City.ToLower().Contains(city.ToLower()));
            }

            // Filter by state
            if (!string.IsNullOrWhiteSpace(state))
            {
                pharmacyQuery = pharmacyQuery.Where(p => p.State.ToLower().Contains(state.ToLower()));
            }

            // Filter by zip code
            if (!string.IsNullOrWhiteSpace(zipCode))
            {
                pharmacyQuery = pharmacyQuery.Where(p => p.ZipCode.Contains(zipCode));
            }

            var pharmacies = await pharmacyQuery.ToListAsync();
            var result = new List<PharmacySearchResultDto>();

            foreach (var pharmacy in pharmacies)
            {
                var pharmacyDto = await MapToDtoAsync(pharmacy);
                var searchResult = new PharmacySearchResultDto
                {
                    Id = pharmacyDto.Id,
                    Name = pharmacyDto.Name,
                    Address = pharmacyDto.Address,
                    City = pharmacyDto.City,
                    State = pharmacyDto.State,
                    ZipCode = pharmacyDto.ZipCode,
                    PhoneNumber = pharmacyDto.PhoneNumber,
                    Email = pharmacyDto.Email,
                    LicenseNumber = pharmacyDto.LicenseNumber,
                    BusinessLicense = pharmacyDto.BusinessLicense,
                    Latitude = pharmacyDto.Latitude,
                    Longitude = pharmacyDto.Longitude,
                    OperatingHours = pharmacyDto.OperatingHours,
                    ApprovalStatus = pharmacyDto.ApprovalStatus,
                    OwnerId = pharmacyDto.OwnerId,
                    OwnerName = pharmacyDto.OwnerName,
                    CreatedAt = pharmacyDto.CreatedAt,
                    UpdatedAt = pharmacyDto.UpdatedAt,
                    ApprovedAt = pharmacyDto.ApprovedAt,
                    IsActive = pharmacyDto.IsActive
                };

                // Calculate distance if user coordinates provided
                if (userLatitude.HasValue && userLongitude.HasValue)
                {
                    searchResult.DistanceInKm = CalculateDistance(
                        userLatitude.Value,
                        userLongitude.Value,
                        pharmacy.Latitude,
                        pharmacy.Longitude);
                }

                // Apply distance filter if specified
                if (maxDistanceKm.HasValue && searchResult.DistanceInKm.HasValue)
                {
                    if (searchResult.DistanceInKm.Value > maxDistanceKm.Value)
                    {
                        continue; // Skip this pharmacy
                    }
                }

                result.Add(searchResult);
            }

            // Sort by distance if available, otherwise by name
            if (userLatitude.HasValue && userLongitude.HasValue)
            {
                result = result.OrderBy(p => p.DistanceInKm ?? double.MaxValue).ToList();
            }
            else
            {
                result = result.OrderBy(p => p.Name).ToList();
            }

            return result;
        }

        public async Task<List<PharmacySearchResultDto>> SearchPharmaciesByMedicineAsync(
            string? medicineName,
            double? userLatitude,
            double? userLongitude,
            bool? availableOnly,
            decimal? maxPrice,
            double? maxDistanceKm)
        {
            // Start with approved and active pharmacies
            var pharmacyQuery = _context.Pharmacies
                .Include(p => p.Owner)
                .Where(p => p.IsActive && 
                           p.ApprovalStatus == ApprovalStatusHelper.ApprovalStatusToString(ApprovalStatus.Approved));

            // If searching by medicine, filter pharmacies that have that medicine
            if (!string.IsNullOrWhiteSpace(medicineName))
            {
                var medicineLower = medicineName.ToLower();
                var pharmaciesWithMedicine = _context.Medicines
                    .Where(m => m.Name.ToLower().Contains(medicineLower) &&
                               (availableOnly != true || m.Quantity > 0) &&
                               (!maxPrice.HasValue || m.Price <= maxPrice.Value) &&
                               m.ExpiryDate > DateTime.UtcNow)
                    .Select(m => m.PharmacyId)
                    .Distinct();

                pharmacyQuery = pharmacyQuery.Where(p => pharmaciesWithMedicine.Contains(p.Id));
            }

            var pharmacies = await pharmacyQuery.ToListAsync();
            var result = new List<PharmacySearchResultDto>();

            foreach (var pharmacy in pharmacies)
            {
                var pharmacyDto = await MapToDtoAsync(pharmacy);
                var searchResult = new PharmacySearchResultDto
                {
                    Id = pharmacyDto.Id,
                    Name = pharmacyDto.Name,
                    Address = pharmacyDto.Address,
                    City = pharmacyDto.City,
                    State = pharmacyDto.State,
                    ZipCode = pharmacyDto.ZipCode,
                    PhoneNumber = pharmacyDto.PhoneNumber,
                    Email = pharmacyDto.Email,
                    LicenseNumber = pharmacyDto.LicenseNumber,
                    BusinessLicense = pharmacyDto.BusinessLicense,
                    Latitude = pharmacyDto.Latitude,
                    Longitude = pharmacyDto.Longitude,
                    OperatingHours = pharmacyDto.OperatingHours,
                    ApprovalStatus = pharmacyDto.ApprovalStatus,
                    OwnerId = pharmacyDto.OwnerId,
                    OwnerName = pharmacyDto.OwnerName,
                    CreatedAt = pharmacyDto.CreatedAt,
                    UpdatedAt = pharmacyDto.UpdatedAt,
                    ApprovedAt = pharmacyDto.ApprovedAt,
                    IsActive = pharmacyDto.IsActive
                };

                // Calculate distance if user coordinates provided
                if (userLatitude.HasValue && userLongitude.HasValue)
                {
                    searchResult.DistanceInKm = CalculateDistance(
                        userLatitude.Value,
                        userLongitude.Value,
                        pharmacy.Latitude,
                        pharmacy.Longitude);
                }

                // Get matching medicines if medicine search was performed
                if (!string.IsNullOrWhiteSpace(medicineName))
                {
                    var medicineLower = medicineName.ToLower();
                    var medicines = await _context.Medicines
                        .Where(m => m.PharmacyId == pharmacy.Id &&
                                   m.Name.ToLower().Contains(medicineLower) &&
                                   (availableOnly != true || m.Quantity > 0) &&
                                   (!maxPrice.HasValue || m.Price <= maxPrice.Value) &&
                                   m.ExpiryDate > DateTime.UtcNow)
                        .ToListAsync();

                    searchResult.MatchingMedicines = medicines.Select(m => new PharmacyMedicineDto
                    {
                        Id = m.Id,
                        Name = m.Name,
                        Price = m.Price,
                        Quantity = m.Quantity
                    }).ToList();
                }

                // Apply distance filter if specified
                if (maxDistanceKm.HasValue && searchResult.DistanceInKm.HasValue)
                {
                    if (searchResult.DistanceInKm.Value > maxDistanceKm.Value)
                    {
                        continue; // Skip this pharmacy
                    }
                }

                result.Add(searchResult);
            }

            // Sort by distance if available, otherwise by name
            if (userLatitude.HasValue && userLongitude.HasValue)
            {
                result = result.OrderBy(p => p.DistanceInKm ?? double.MaxValue).ToList();
            }
            else
            {
                result = result.OrderBy(p => p.Name).ToList();
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

        private async Task<PharmacyDto> MapToDtoAsync(Pharmacy pharmacy)
        {
            OperatingHoursDto? operatingHours = null;
            if (!string.IsNullOrEmpty(pharmacy.OperatingHours))
            {
                try
                {
                    operatingHours = JsonSerializer.Deserialize<OperatingHoursDto>(pharmacy.OperatingHours);
                }
                catch
                {
                    operatingHours = new OperatingHoursDto();
                }
            }

            return new PharmacyDto
            {
                Id = pharmacy.Id,
                Name = pharmacy.Name,
                Address = pharmacy.Address,
                City = pharmacy.City,
                State = pharmacy.State,
                ZipCode = pharmacy.ZipCode,
                PhoneNumber = pharmacy.PhoneNumber,
                Email = pharmacy.Email,
                LicenseNumber = pharmacy.LicenseNumber,
                BusinessLicense = pharmacy.BusinessLicense,
                Latitude = pharmacy.Latitude,
                Longitude = pharmacy.Longitude,
                OperatingHours = operatingHours ?? new OperatingHoursDto(),
                ApprovalStatus = ApprovalStatusHelper.StringToApprovalStatus(pharmacy.ApprovalStatus),
                OwnerId = pharmacy.OwnerId,
                OwnerName = pharmacy.Owner != null ? $"{pharmacy.Owner.FirstName} {pharmacy.Owner.LastName}" : null,
                CreatedAt = pharmacy.CreatedAt,
                UpdatedAt = pharmacy.UpdatedAt,
                ApprovedAt = pharmacy.ApprovedAt,
                IsActive = pharmacy.IsActive
            };
        }
    }
}

