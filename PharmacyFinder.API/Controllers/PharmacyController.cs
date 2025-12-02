using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmacyFinder.Application.Interfaces;
using PharmacyFinder.Core.DTOs;
using PharmacyFinder.Core.Enums;
using PharmacyFinder.Core.Helpers;
using System.Security.Claims;

namespace PharmacyFinder.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PharmacyController : ControllerBase
    {
        private readonly IPharmacyService _pharmacyService;

        public PharmacyController(IPharmacyService pharmacyService)
        {
            _pharmacyService = pharmacyService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<PharmacyDto>> RegisterPharmacy(RegisterPharmacyDto request)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            try
            {
                var pharmacy = await _pharmacyService.RegisterPharmacyAsync(request, userId.Value);
                return Ok(pharmacy);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PharmacyDto>> GetPharmacy(int id)
        {
            var pharmacy = await _pharmacyService.GetPharmacyByIdAsync(id);
            if (pharmacy == null)
            {
                return NotFound();
            }
            return Ok(pharmacy);
        }

        [HttpGet("my-pharmacies")]
        public async Task<ActionResult<List<PharmacyDto>>> GetMyPharmacies()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized();
            }

            var pharmacies = await _pharmacyService.GetPharmaciesByOwnerIdAsync(userId.Value);
            return Ok(pharmacies);
        }

        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<PharmacyDto>>> GetPendingPharmacies()
        {
            var pharmacies = await _pharmacyService.GetPendingPharmaciesAsync();
            return Ok(pharmacies);
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<PharmacyDto>>> GetAllPharmacies()
        {
            var pharmacies = await _pharmacyService.GetAllPharmaciesAsync();
            return Ok(pharmacies);
        }

        [HttpPut("{id}/approval")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PharmacyDto>> UpdatePharmacyApproval(int id, UpdatePharmacyApprovalDto request)
        {
            var adminId = GetCurrentUserId();
            if (adminId == null)
            {
                return Unauthorized();
            }

            try
            {
                var pharmacy = await _pharmacyService.UpdatePharmacyApprovalAsync(id, request, adminId.Value);
                return Ok(pharmacy);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PharmacyDto>> UpdatePharmacy(int id, UpdatePharmacyDto request)
        {
            var adminId = GetCurrentUserId();
            if (adminId == null)
            {
                return Unauthorized();
            }

            try
            {
                var pharmacy = await _pharmacyService.UpdatePharmacyAsync(id, request, adminId.Value);
                return Ok(pharmacy);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeletePharmacy(int id)
        {
            var adminId = GetCurrentUserId();
            if (adminId == null)
            {
                return Unauthorized();
            }

            try
            {
                await _pharmacyService.DeletePharmacyAsync(id, adminId.Value);
                return Ok(new { message = "Pharmacy deleted successfully" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
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

