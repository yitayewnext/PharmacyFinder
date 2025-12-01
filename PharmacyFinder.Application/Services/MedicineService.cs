using Microsoft.EntityFrameworkCore;
using PharmacyFinder.Application.Interfaces;
using PharmacyFinder.Core.DTOs;
using PharmacyFinder.Core.Entities;
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
