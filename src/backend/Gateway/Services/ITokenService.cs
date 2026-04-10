namespace backend.Gateway.Services;

public interface ITokenService
{
    string GenerateToken(string userId, string email, IEnumerable<string> roles);
    bool ValidateToken(string token);
    IEnumerable<KeyValuePair<string, string>> GetClaims(string token);
}
