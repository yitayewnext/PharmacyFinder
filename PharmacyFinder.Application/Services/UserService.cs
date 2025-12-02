using PharmacyFinder.Application.Interfaces;
using PharmacyFinder.Core.DTOs;
using PharmacyFinder.Core.Entities;
using PharmacyFinder.Core.Enums;
using PharmacyFinder.Core.Helpers;
using PharmacyFinder.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace PharmacyFinder.Application.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;

        public UserService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<UserDto>> GetPendingUsersAsync()
        {
            var users = await _context.Users
                .Where(u => u.ApprovalStatus == ApprovalStatusHelper.ApprovalStatusToString(ApprovalStatus.Pending) && u.IsActive)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return users.Select(u => MapToDto(u)).ToList();
        }

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            // Return all users including inactive for admin management
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return users.Select(u => MapToDto(u)).ToList();
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            // Allow getting inactive users for admin management
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id);

            return user == null ? null : MapToDto(user);
        }

        public async Task<UserDto> UpdateUserApprovalAsync(int userId, UpdateUserApprovalDto request, int adminId)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            user.ApprovalStatus = ApprovalStatusHelper.ApprovalStatusToString(request.ApprovalStatus);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(user);
        }

        public async Task<UserDto> UpdateUserAsync(int userId, UpdateUserDto request, int adminId)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            // Validate email uniqueness if changed
            if (user.Email != request.Email.ToLower())
            {
                if (await _context.Users.AnyAsync(u => u.Email == request.Email.ToLower() && u.Id != userId && u.IsActive))
                {
                    throw new ArgumentException("Email already exists");
                }
            }

            user.Email = request.Email.ToLower();
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Role = RoleHelper.RoleToString(request.Role);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(user);
        }

        public async Task<bool> DeleteUserAsync(int userId, int adminId)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            // Soft delete
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<UserDto> ActivateUserAsync(int userId, int adminId)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(user);
        }

        public async Task<UserDto> DeactivateUserAsync(int userId, int adminId)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(user);
        }

        private UserDto MapToDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = RoleHelper.StringToRole(user.Role),
                ApprovalStatus = ApprovalStatusHelper.StringToApprovalStatus(user.ApprovalStatus),
                LicenseNumber = user.LicenseNumber,
                CreatedAt = user.CreatedAt,
                IsActive = user.IsActive
            };
        }
    }
}

