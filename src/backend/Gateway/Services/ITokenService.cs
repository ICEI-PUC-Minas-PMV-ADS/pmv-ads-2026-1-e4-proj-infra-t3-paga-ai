using System.Collections.Generic;
using System.Security.Claims;

namespace backend.Gateway.Services;

public interface ITokenService
{
    string GenerateToken(string userId, string email, IEnumerable<string> roles);
    bool ValidateToken(string token);
    ClaimsPrincipal GetClaims(string token);
}
