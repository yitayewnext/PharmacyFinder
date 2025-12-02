using PharmacyFinder.Core.DTOs;

namespace PharmacyFinder.Application.Interfaces
{
    public interface IUserService
    {
        Task<List<UserDto>> GetPendingUsersAsync();
        Task<List<UserDto>> GetAllUsersAsync();
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<UserDto> UpdateUserApprovalAsync(int userId, UpdateUserApprovalDto request, int adminId);
        Task<UserDto> UpdateUserAsync(int userId, UpdateUserDto request, int adminId);
        Task<bool> DeleteUserAsync(int userId, int adminId);
        Task<UserDto> ActivateUserAsync(int userId, int adminId);
        Task<UserDto> DeactivateUserAsync(int userId, int adminId);
    }
}

