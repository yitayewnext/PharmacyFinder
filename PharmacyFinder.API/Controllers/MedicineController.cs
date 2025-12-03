using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmacyFinder.Application.Interfaces;
using PharmacyFinder.Core.DTOs;
using System.Security.Claims;

namespace PharmacyFinder.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MedicineController : ControllerBase
    {
        private readonly IMedicineService _medicineService;

        public MedicineController(IMedicineService medicineService)
        {
            _medicineService = medicineService;
        }

        [HttpPost("{pharmacyId}")]
        [Authorize(Roles = "PharmacyOwner")]
        public async Task<ActionResult<MedicineDto>> AddMedicine(int pharmacyId, CreateMedicineDto request)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            try
            {
                var medicine = await _medicineService.AddMedicineAsync(pharmacyId, request, userId.Value);
                return CreatedAtAction(nameof(GetMedicine), new { id = medicine.Id }, medicine);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "PharmacyOwner")]
        public async Task<ActionResult<MedicineDto>> UpdateMedicine(int id, UpdateMedicineDto request)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            try
            {
                var medicine = await _medicineService.UpdateMedicineAsync(id, request, userId.Value);
                return Ok(medicine);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "PharmacyOwner")]
        public async Task<ActionResult> DeleteMedicine(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            try
            {
                await _medicineService.DeleteMedicineAsync(id, userId.Value);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<MedicineDto>>> SearchMedicines([FromQuery] string query)
        {
            var medicines = await _medicineService.SearchMedicinesAsync(query);
            return Ok(medicines);
        }

        [HttpGet("search-with-pharmacy")]
        public async Task<ActionResult<List<MedicineSearchResultDto>>> SearchMedicinesWithPharmacy(
            [FromQuery] string? query = null,
            [FromQuery] double? latitude = null,
            [FromQuery] double? longitude = null,
            [FromQuery] bool? availableOnly = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] string? category = null,
            [FromQuery] double? maxDistanceKm = null)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { error = "Invalid request parameters", details = ModelState });
            }

            try
            {
                // Normalize empty string to null
                query = string.IsNullOrWhiteSpace(query) ? null : query;

                var medicines = await _medicineService.SearchMedicinesWithPharmacyAsync(
                    query ?? string.Empty,
                    latitude,
                    longitude,
                    availableOnly,
                    minPrice,
                    maxPrice,
                    category,
                    maxDistanceKm);
                return Ok(medicines);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to search medicines: " + ex.Message });
            }
        }

        [HttpGet("pharmacy/{pharmacyId}")]
        public async Task<ActionResult<List<MedicineDto>>> GetMedicinesByPharmacy(int pharmacyId)
        {
            var medicines = await _medicineService.GetMedicinesByPharmacyIdAsync(pharmacyId);
            return Ok(medicines);
        }

        // Parameterized route must come AFTER specific routes
        [HttpGet("{id}")]
        public async Task<ActionResult<MedicineDto>> GetMedicine(int id)
        {
            var medicine = await _medicineService.GetMedicineByIdAsync(id);
            if (medicine == null) return NotFound();
            return Ok(medicine);
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            return null;
        }
    }
}
