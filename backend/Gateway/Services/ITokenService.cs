namespace backend.Gateway.Services;

/// <summary>
/// Interface for JWT token generation and validation
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// Generates a JWT token for the specified user
    /// </summary>
    string GenerateToken(string userId, string email, IEnumerable<string> roles);

    /// <summary>
    /// Validates a JWT token
    /// </summary>
    bool ValidateToken(string token);

    /// <summary>
    /// Extracts claims from a JWT token
    /// </summary>
    Dictionary<string, string> GetClaims(string token);
}
