# API Gateway Documentation

## Overview

The API Gateway is an Ocelot-based gateway integrated directly into the backend project. It provides:

- **Request Routing**: Route API requests to appropriate microservices
- **Authentication**: JWT-based authentication and authorization
- **Rate Limiting**: Control request rates per client
- **Logging & Monitoring**: Comprehensive request/response logging
- **Error Handling**: Centralized error handling with consistent responses
- **Request Transformation**: Add headers and transform requests

## Architecture

```
Client Requests
     ↓
Gateway Controller (token management)
     ↓
Ocelot Routes (request routing)
     ↓
Authentication Middleware
     ↓
Logging Middleware
     ↓
Request Transformation Middleware
     ↓
Error Handling Middleware
     ↓
Backend Services/Microservices
```

## Components

### Gateway Services

#### TokenService (`Gateway/Services/TokenService.cs`)
- **GenerateToken()**: Creates JWT tokens with user claims and roles
- **ValidateToken()**: Validates JWT token signatures and expiration
- **GetClaims()**: Extracts claims from a JWT token

#### RateLimitService (`Gateway/Services/RateLimitService.cs`)
- **IsRateLimitExceededAsync()**: Checks if client has exceeded rate limit
- **RecordRequestAsync()**: Records request for tracking
- **GetRequestCountAsync()**: Gets current request count for a client

### Gateway Middleware

#### LoggingMiddleware
Logs incoming and outgoing HTTP requests with execution times and status codes.

#### ErrorHandlingMiddleware
Provides centralized error handling with consistent JSON error responses.

#### RequestTransformationMiddleware
Adds correlation IDs and timestamps to requests for tracking.

## Usage

### 1. Generate a Token

To access protected endpoints, first generate a JWT token:

**Request:**
```bash
POST /api/gateway/token
Content-Type: application/json

{
  "userId": "user123",
  "email": "user@example.com",
  "roles": ["user", "admin"]
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "60 minutes"
}
```

### 2. Use the Token

Add the token to your requests using the Authorization header:

```bash
GET /api/emprestimos
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Validate a Token

To validate an existing token:

**Request:**
```bash
POST /api/gateway/validate
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "claims": {
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "user123",
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": "user@example.com",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "user"
  }
}
```

### 4. Health Check

Check gateway status:

```bash
GET /api/gateway/health
```

## Configuration

### appsettings.json

```json
{
  "GatewaySettings": {
    "JwtSecret": "your-super-secret-key-minimum-32-characters",
    "JwtIssuer": "paga-ai-gateway",
    "JwtAudience": "paga-ai-clients",
    "JwtExpirationMinutes": 60
  },
  "RateLimiting": {
    "Enabled": true,
    "RequestsPerMinute": 100
  }
}
```

### ocelot.json

The `ocelot.json` file contains routing configuration:

```json
{
  "Routes": [
    {
      "DownstreamPathTemplate": "/api/{controller}/{action?}/{id?}",
      "UpstreamPathTemplate": "/api/{controller}/{action?}/{id?}",
      "DownstreamHostAndPorts": [
        {
          "Host": "localhost",
          "Port": 7222
        }
      ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "Bearer"
      },
      "RateLimitOptions": {
        "EnableRateLimiting": true,
        "Limit": 100,
        "Period": "1m"
      }
    }
  ]
}
```

## Adding New Routes

To add a new microservice route, add a route entry to `ocelot.json`:

```json
{
  "DownstreamPathTemplate": "/api/users/{action?}/{id?}",
  "DownstreamScheme": "https",
  "DownstreamHostAndPorts": [
    {
      "Host": "user-service.example.com",
      "Port": 443
    }
  ],
  "UpstreamPathTemplate": "/api/users/{action?}/{id?}",
  "UpstreamHttpMethod": ["Get", "Post", "Put", "Delete"],
  "AuthenticationOptions": {
    "AuthenticationProviderKey": "Bearer",
    "AllowedScopes": ["paga-ai-api"]
  },
  "RateLimitOptions": {
    "EnableRateLimiting": true,
    "Limit": 50,
    "Period": "1m"
  }
}
```

## Rate Limiting

Rate limiting is controlled per client using the `X-Client-Id` header:

```bash
GET /api/emprestimos
Authorization: Bearer token
X-Client-Id: client-123
```

Configuration:
- **Default Limit**: 100 requests per minute
- **Status Code**: 429 (Too Many Requests)
- **Response**: Includes `Retry-After` header

## Authentication & Authorization

JWT tokens include:
- **UserId**: Unique user identifier
- **Email**: User email address
- **Roles**: Array of user roles

Token claims can be accessed in controllers:

```csharp
[Authorize(Roles = "admin")]
[HttpPost]
public async Task<IActionResult> CreateEmprestimo(...)
{
    // Only admin users can access this endpoint
}
```

## Middleware Execution Order

1. **LoggingMiddleware** - Logs all requests
2. **RequestTransformationMiddleware** - Adds correlation IDs and timestamps
3. **ErrorHandlingMiddleware** - Catches exceptions and returns consistent error responses
4. **Authentication** - Validates JWT tokens
5. **Authorization** - Checks user roles and permissions
6. **Route Handler** - Processes the request

## Error Handling

All errors return consistent JSON responses:

```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2024-08-29T10:00:00Z",
  "traceId": "0HMVIB7FP6V5K:00000001"
}
```

## Logging

Logs are output to console and can be configured in `appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Ocelot": "Debug"
    }
  }
}
```

Example logs:
```
info: backend.Gateway.Middleware.LoggingMiddleware[0]
      Incoming Request: POST /api/gateway/token - Client: ::1
info: backend.Gateway.Middleware.LoggingMiddleware[0]
      Request Completed: POST /api/gateway/token - Status: 200 - Duration: 45ms
```

## Security Considerations

1. **JWT Secret Management**
   - Change `JwtSecret` in production
   - Use environment variables for secrets
   - Minimum 32 characters required

2. **HTTPS Only**
   - Always use HTTPS in production
   - Redirect HTTP to HTTPS

3. **Token Expiration**
   - Default: 60 minutes
   - Adjust `JwtExpirationMinutes` based on security requirements

4. **CORS**
   - Currently allows all origins in development
   - Configure specific origins in production

5. **Rate Limiting**
   - Enable in production
   - Adjust limits based on capacity

## Development

### Running the Gateway

```bash
cd backend
dotnet run
```

The gateway will be available at:
- HTTP: `http://localhost:5220`
- HTTPS: `https://localhost:7220`

### Testing

Generate a token:
```bash
curl -X POST https://localhost:7220/api/gateway/token \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "email": "test@example.com",
    "roles": ["user"]
  }'
```

Access an endpoint with the token:
```bash
curl -X GET https://localhost:7220/api/emprestimos/carteira/cobrador1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Future Enhancements

1. **Circuit Breaker Pattern** - Implement Polly policies for resilience
2. **Service Discovery** - Dynamic service registration and discovery
3. **Distributed Tracing** - Add OpenTelemetry for request tracing
4. **API Versioning** - Version endpoints using headers or URL paths
5. **GraphQL Gateway** - Add GraphQL layer on top of REST APIs
6. **Caching** - Implement response caching strategies
7. **Request/Response Transformation** - Advanced request/response mapping
