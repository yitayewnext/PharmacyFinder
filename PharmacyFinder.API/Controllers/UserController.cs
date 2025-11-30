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
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<UserDto>>> GetAllUsers()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<UserDto>>> GetPendingUsers()
        {
            var users = await _userService.GetPendingUsersAsync();
            return Ok(users);
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }
            return Ok(user);
        }

        [HttpPut("{id}/approval")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<UserDto>> UpdateUserApproval(int id, UpdateUserApprovalDto request)
        {
            var adminId = GetCurrentUserId();
            if (adminId == null)
            {
                return Unauthorized();
            }

            try
            {
                var user = await _userService.UpdateUserApprovalAsync(id, request, adminId.Value);
                return Ok(user);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<UserDto>> UpdateUser(int id, UpdateUserDto request)
        {
            var adminId = GetCurrentUserId();
            if (adminId == null)
            {
                return Unauthorized();
            }

            try
            {
                var user = await _userService.UpdateUserAsync(id, request, adminId.Value);
                return Ok(user);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeleteUser(int id)
        {
            var adminId = GetCurrentUserId();
            if (adminId == null)
            {
                return Unauthorized();
            }

            try
            {
                await _userService.DeleteUserAsync(id, adminId.Value);
                return Ok(new { message = "User deleted successfully" });
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

