# API Gateway Test Results

**Date:** October 23, 2025  
**Gateway URL:** http://localhost:8080  
**Status:** ✅ OPERATIONAL

## Summary

All backend services are accessible through the API Gateway. The gateway properly routes requests to:
- Auth Service (Node.js/Express) on port 3001
- Match Service (Python/FastAPI) on port 8000  
- Referee Service (Python/FastAPI) on port 3004
- Availability Service (Python/FastAPI) on port 8000

## Important Notes

### FastAPI Trailing Slash Behavior
FastAPI services automatically redirect URLs without trailing slashes (e.g., `/referees`) to URLs with trailing slashes (`/referees/`). 

**Solution:** Always include trailing slashes in FastAPI endpoint requests, or use query parameters which override the redirect behavior.

## Endpoint Tests

### ✅ Auth Service
```bash
# Login endpoint
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sgad.com","password":"password123"}'
```
**Result:** Auth service responds with validation errors (expected without valid credentials)

### ✅ Referee Service  
```bash
# List referees (with trailing slash)
curl http://localhost:8080/referees/

# Get specific referee
curl http://localhost:8080/referees/{uuid}
```
**Result:** Returns 2 referees successfully

### ✅ Match Service
```bash
# List matches (query params work without trailing slash)
curl "http://localhost:8080/matches?limit=10"

# Get specific match
curl http://localhost:8080/matches/{match_id}
```
**Result:** Returns 4 matches successfully

### ✅ Availability Service
```bash
# Note: Most endpoints require authentication
curl http://localhost:8080/availability/me
curl http://localhost:8080/availability/date/{yyyy-mm-dd}
```
**Result:** Returns 401 Unauthorized (expected - requires JWT token)

## Frontend Integration

The frontend Next.js application should use these URLs:

```env
# Browser-side (NEXT_PUBLIC_* variables)
NEXT_PUBLIC_API_URL=http://localhost:8080

# Server-side (Next.js SSR)
API_URL=http://localhost:8080
REFEREE_SERVICE_URL=http://localhost:8080
MATCH_SERVICE_URL=http://localhost:8080
AVAILABILITY_SERVICE_URL=http://localhost:8080
```

## Gateway Configuration

The API Gateway routes are configured in `GatewayConfig.java`:

| Path Pattern | Target Service | Internal URL |
|--------------|---------------|--------------|
| `/auth/**` | auth-service | http://auth-service:3001 |
| `/matches/**` | match-service | http://match-service:8000 |
| `/referees/**` | referee-service | http://referee-service:3004 |
| `/availability/**` | availability-service | http://availability-service:8000 |

## Troubleshooting

### Issue: 307 Redirect with internal Docker hostname
**Cause:** FastAPI redirects `/endpoint` to `/endpoint/`  
**Solution:** Always use trailing slashes for FastAPI endpoints

### Issue: Frontend can't connect to Gateway
**Cause:** Incorrect environment variables  
**Solution:** Ensure all *_SERVICE_URL vars point to `http://localhost:8080`

### Issue: Services can't communicate
**Cause:** Docker network misconfiguration  
**Solution:** All services must be in the same docker-compose network
