namespace backend.Gateway.Configuration;

/// <summary>
/// Configuration settings for the API Gateway
/// </summary>
public class GatewaySettings
{
    public string JwtSecret { get; set; } = string.Empty;
    public string JwtIssuer { get; set; } = "paga-ai-gateway";
    public string JwtAudience { get; set; } = "paga-ai-clients";
    public int JwtExpirationMinutes { get; set; } = 60;
}
