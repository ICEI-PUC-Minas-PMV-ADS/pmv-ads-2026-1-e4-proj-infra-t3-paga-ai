using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Gateway.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace backend.Gateway.Services;

public class TokenService : ITokenService
{
    private readonly GatewaySettings _settings;
    private readonly JwtSecurityTokenHandler _tokenHandler = new();

    public TokenService(GatewaySettings settings)
    {
        _settings = settings;
    }

    public string GenerateToken(string userId, string email, IEnumerable<string> roles)
    {
        var key = Encoding.UTF8.GetBytes(_settings.JwtSecret);
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_settings.JwtExpirationMinutes),
            Issuer = _settings.JwtIssuer,
            Audience = _settings.JwtAudience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = _tokenHandler.CreateToken(tokenDescriptor);
        return _tokenHandler.WriteToken(token);
    }

    public bool ValidateToken(string token)
    {
        try
        {
            var key = Encoding.UTF8.GetBytes(_settings.JwtSecret);
            _tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _settings.JwtIssuer,
                ValidAudience = _settings.JwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ClockSkew = TimeSpan.Zero
            }, out _);

            return true;
        }
        catch
        {
            return false;
        }
    }

    public ClaimsPrincipal GetClaims(string token)
    {
        var key = Encoding.UTF8.GetBytes(_settings.JwtSecret);
        return _tokenHandler.ValidateToken(token, new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = _settings.JwtIssuer,
            ValidAudience = _settings.JwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.Zero
        }, out _);
    }
}
