using PharmacyFinder.Core.Entities;

namespace PharmacyFinder.Core.Interfaces
{
    public interface IJwtService
    {
        string GenerateToken(User user);
        int? ValidateToken(string token);
    }
}