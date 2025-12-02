using PharmacyFinder.Application.Interfaces;
using PharmacyFinder.Core.DTOs;
using PharmacyFinder.Core.Entities;
using PharmacyFinder.Core.Enums;
using PharmacyFinder.Core.Helpers;
using PharmacyFinder.Core.Interfaces;
using PharmacyFinder.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace PharmacyFinder.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtService _jwtService;

        public AuthService(ApplicationDbContext context, IPasswordHasher passwordHasher, IJwtService jwtService)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _jwtService = jwtService;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
        {
            // Validate email uniqueness
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                throw new ArgumentException("Email already exists");
            }

            // Validate license number for pharmacy owners
            if (request.Role == UserRole.PharmacyOwner)
            {
                if (string.IsNullOrWhiteSpace(request.LicenseNumber))
                {
                    throw new ArgumentException("License number is required for pharmacy owners");
                }

                // Check if license number already exists
                if (await _context.Users.AnyAsync(u => u.LicenseNumber == request.LicenseNumber && u.IsActive))
                {
                    throw new ArgumentException("License number already exists");
                }
            }

            // Determine approval status based on role
            // Admin and Customer are auto-approved, PharmacyOwner requires approval
            var approvalStatus = (request.Role == UserRole.Admin || request.Role == UserRole.Customer)
                ? ApprovalStatus.Approved
                : ApprovalStatus.Pending;

            // Create user
            var user = new User
            {
                Email = request.Email.ToLower(),
                PasswordHash = _passwordHasher.Hash(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Role = RoleHelper.RoleToString(request.Role), // Convert enum to string for database
                ApprovalStatus = ApprovalStatusHelper.ApprovalStatusToString(approvalStatus),
                LicenseNumber = request.Role == UserRole.PharmacyOwner ? request.LicenseNumber : null
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Generate token
            var token = _jwtService.GenerateToken(user);

            return new AuthResponseDto
            {
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = RoleHelper.StringToRole(user.Role), // Convert string from database to enum
                    ApprovalStatus = ApprovalStatusHelper.StringToApprovalStatus(user.ApprovalStatus), // Convert string to enum
                    LicenseNumber = user.LicenseNumber,
                    IsActive = user.IsActive
                }
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
        {
            // First, check if user exists (regardless of IsActive status)
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower());

            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            // Check if account is deactivated
            if (!user.IsActive)
            {
                throw new UnauthorizedAccessException("Your account has been deactivated. Please contact the administrator.");
            }

            // Verify password
            if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            // Check approval status based on role
            var userRole = RoleHelper.StringToRole(user.Role);
            
            // Admin and Customer are auto-approved, so skip approval check for them
            if (userRole == UserRole.PharmacyOwner)
            {
                var approvalStatus = ApprovalStatusHelper.StringToApprovalStatus(user.ApprovalStatus);
                if (approvalStatus != ApprovalStatus.Approved)
                {
                    throw new UnauthorizedAccessException("Your account is pending approval. Please wait for admin approval.");
                }

                // For pharmacy owners, also check if their pharmacy is approved (if they have one)
                var pharmacy = await _context.Pharmacies
                    .FirstOrDefaultAsync(p => p.OwnerId == user.Id && p.IsActive);

                if (pharmacy != null)
                {
                    var pharmacyApprovalStatus = ApprovalStatusHelper.StringToApprovalStatus(pharmacy.ApprovalStatus);
                    if (pharmacyApprovalStatus != ApprovalStatus.Approved)
                    {
                        if (pharmacyApprovalStatus == ApprovalStatus.Pending)
                        {
                            throw new UnauthorizedAccessException("Your pharmacy registration is pending approval. Please wait for admin approval.");
                        }
                        else if (pharmacyApprovalStatus == ApprovalStatus.Rejected)
                        {
                            throw new UnauthorizedAccessException("Your pharmacy registration has been rejected. Please contact support.");
                        }
                    }
                }
                // If no pharmacy registered yet, allow login so they can register
            }

            var token = _jwtService.GenerateToken(user);

            return new AuthResponseDto
            {
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = RoleHelper.StringToRole(user.Role), // Convert string from database to enum
                    ApprovalStatus = ApprovalStatusHelper.StringToApprovalStatus(user.ApprovalStatus), // Convert string to enum
                    LicenseNumber = user.LicenseNumber,
                    IsActive = user.IsActive
                }
            };
        }
    }
}