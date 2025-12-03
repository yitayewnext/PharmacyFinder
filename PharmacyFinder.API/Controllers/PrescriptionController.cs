using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmacyFinder.Application.Interfaces;
using PharmacyFinder.Core.DTOs;
using System.Security.Claims;

namespace PharmacyFinder.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PrescriptionController : ControllerBase
    {
        private readonly IPrescriptionService _prescriptionService;
        private readonly IWebHostEnvironment _environment;

        public PrescriptionController(
            IPrescriptionService prescriptionService, 
            IWebHostEnvironment environment)
        {
            _prescriptionService = prescriptionService;
            _environment = environment;
        }

        [HttpPost("upload")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<PrescriptionDto>> UploadPrescription([FromForm] IFormFile file, [FromForm] string? extractedText = null)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            try
            {
                var uploadPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads", "prescriptions");
                var prescription = await _prescriptionService.UploadPrescriptionAsync(userId.Value, file, uploadPath, extractedText);
                
                // Automatically process prescription if text was extracted
                if (!string.IsNullOrWhiteSpace(extractedText))
                {
                    try
                    {
                        prescription = await _prescriptionService.ProcessPrescriptionAsync(prescription.Id, userId.Value);
                    }
                    catch (Exception ex)
                    {
                        // Log error but don't fail the upload
                        // Prescription is saved, processing can be retried later
                        Console.WriteLine($"Warning: Failed to auto-process prescription {prescription.Id}: {ex.Message}");
                    }
                }
                
                return Ok(prescription);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to upload prescription: " + ex.Message });
            }
        }

        [HttpGet("my-prescriptions")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<List<PrescriptionDto>>> GetMyPrescriptions()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            try
            {
                var prescriptions = await _prescriptionService.GetCustomerPrescriptionsAsync(userId.Value);
                return Ok(prescriptions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve prescriptions: " + ex.Message });
            }
        }

        // Parameterized route must come AFTER specific routes
        [HttpGet("{id}")]
        public async Task<ActionResult<PrescriptionDto>> GetPrescription(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            try
            {
                var prescription = await _prescriptionService.GetPrescriptionByIdAsync(id, userId.Value);
                return Ok(prescription);
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

        [HttpPost("{id}/process")]
        public async Task<ActionResult<PrescriptionDto>> ProcessPrescription(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            try
            {
                var prescription = await _prescriptionService.ProcessPrescriptionAsync(id, userId.Value);
                return Ok(prescription);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to process prescription: " + ex.Message });
            }
        }

        [HttpPost("extract-medicines")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<ExtractMedicinesResponse>> ExtractMedicines([FromBody] ExtractTextRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Text))
            {
                return BadRequest(new { error = "Text is required" });
            }

            try
            {
                var result = await _prescriptionService.ExtractMedicinesFromTextAsync(request.Text);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to extract medicines: " + ex.Message });
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

