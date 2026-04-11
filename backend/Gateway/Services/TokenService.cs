using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace backend.Gateway.Services;

/// <summary>
/// Service for JWT token generation and validation
/// </summary>
public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<TokenService> _logger;

    public TokenService(IConfiguration configuration, ILogger<TokenService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public string GenerateToken(string userId, string email, IEnumerable<string> roles)
    {
        var jwtSettings = _configuration.GetSection("GatewaySettings");
        var jwtSecret = jwtSettings["JwtSecret"] ?? throw new InvalidOperationException("JWT Secret is not configured");
        var jwtIssuer = jwtSettings["JwtIssuer"] ?? "paga-ai-gateway";
        var jwtAudience = jwtSettings["JwtAudience"] ?? "paga-ai-clients";
        var jwtExpirationMinutes = int.Parse(jwtSettings["JwtExpirationMinutes"] ?? "60");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Email, email)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(jwtExpirationMinutes),
            signingCredentials: credentials);

        _logger.LogInformation("Token generated for user: {UserId}", userId);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public bool ValidateToken(string token)
    {
        try
        {
            var jwtSettings = _configuration.GetSection("GatewaySettings");
            var jwtSecret = jwtSettings["JwtSecret"] ?? throw new InvalidOperationException("JWT Secret is not configured");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

            var tokenHandler = new JwtSecurityTokenHandler();
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            return validatedToken is JwtSecurityToken;
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Token validation failed: {Message}", ex.Message);
            return false;
        }
    }

    public Dictionary<string, string> GetClaims(string token)
    {
        var claims = new Dictionary<string, string>();

        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadToken(token) as JwtSecurityToken;

            if (jwtToken != null)
            {
                foreach (var claim in jwtToken.Claims)
                {
                    claims[claim.Type] = claim.Value;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError("Error extracting claims from token: {Message}", ex.Message);
        }

        return claims;
    }
}
