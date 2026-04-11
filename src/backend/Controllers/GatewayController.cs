using Microsoft.AspNetCore.Mvc;
using backend.Gateway.Services;

namespace backend.Controllers;

/// <summary>
/// Gateway controller for authentication and gateway management
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class GatewayController : ControllerBase
{
    private readonly ITokenService _tokenService;
    private readonly ILogger<GatewayController> _logger;

    public GatewayController(ITokenService tokenService, ILogger<GatewayController> logger)
    {
        _tokenService = tokenService;
        _logger = logger;
    }

    [HttpPost("token")]
    public IActionResult GenerateToken([FromBody] TokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserId) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "UserId and Email are required" });
        }

        try
        {
            var roles = request.Roles ?? new List<string> { "user" };
            var token = _tokenService.GenerateToken(request.UserId, request.Email, roles);

            _logger.LogInformation("Token generated for user: {UserId}", request.UserId);

            return Ok(new 
            { 
                success = true,
                token = token,
                expiresIn = "60 minutes"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating token for user: {UserId}", request.UserId);
            return StatusCode(500, new { message = "Error generating token", error = ex.Message });
        }
    }

    [HttpPost("validate")]
    public IActionResult ValidateToken([FromBody] ValidateTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return BadRequest(new { message = "Token is required" });
        }

        var isValid = _tokenService.ValidateToken(request.Token);
        if (!isValid)
        {
            return Unauthorized(new { message = "Invalid or expired token" });
        }

        var claims = _tokenService.GetClaims(request.Token);
        return Ok(new 
        { 
            success = true,
            valid = true,
            claims = claims
        });
    }

    [HttpGet("health")]
    public IActionResult HealthCheck()
    {
        return Ok(new 
        { 
            status = "Gateway is running",
            timestamp = DateTime.UtcNow,
            version = "1.0.0"
        });
    }
}

public class TokenRequest
{
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public List<string>? Roles { get; set; }
}

public class ValidateTokenRequest
{
    public string Token { get; set; } = string.Empty;
}
