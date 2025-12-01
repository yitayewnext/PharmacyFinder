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

        [HttpGet("{id}")]
        public async Task<ActionResult<MedicineDto>> GetMedicine(int id)
        {
            var medicine = await _medicineService.GetMedicineByIdAsync(id);
            if (medicine == null) return NotFound();
            return Ok(medicine);
        }

        [HttpGet("pharmacy/{pharmacyId}")]
        public async Task<ActionResult<List<MedicineDto>>> GetMedicinesByPharmacy(int pharmacyId)
        {
            var medicines = await _medicineService.GetMedicinesByPharmacyIdAsync(pharmacyId);
            return Ok(medicines);
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<MedicineDto>>> SearchMedicines([FromQuery] string query)
        {
            var medicines = await _medicineService.SearchMedicinesAsync(query);
            return Ok(medicines);
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
