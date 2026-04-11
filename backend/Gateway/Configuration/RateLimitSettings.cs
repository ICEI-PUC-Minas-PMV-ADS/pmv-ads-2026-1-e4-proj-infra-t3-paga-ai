namespace backend.Gateway.Configuration;

/// <summary>
/// Configuration settings for rate limiting
/// </summary>
public class RateLimitSettings
{
    public bool Enabled { get; set; } = true;
    public int RequestsPerMinute { get; set; } = 100;
}
