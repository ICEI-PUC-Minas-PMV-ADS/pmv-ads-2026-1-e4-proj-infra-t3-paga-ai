namespace backend.Gateway.Configuration;

public class GatewaySettings
{
    public string JwtSecret { get; set; } = string.Empty;
    public string JwtIssuer { get; set; } = string.Empty;
    public string JwtAudience { get; set; } = string.Empty;
    public int JwtExpirationMinutes { get; set; } = 60;
}
