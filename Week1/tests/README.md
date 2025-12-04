# Load Testing Guide

## Quick Start

### 1. Basic Health Check Test (No Authentication)
```bash
node load-test.js
```

This will test the `/api/health` endpoint with 10 concurrent requests.

### 2. Full Test with Authentication

First, get an auth token:
1. Open https://mindx-minhnh.135.171.192.18.nip.io in your browser
2. Log in through MindX SSO
3. Open browser DevTools (F12)
4. Go to **Application** tab → **Cookies**
5. Find and copy the auth token value

Then run:
```bash
# Windows PowerShell
$env:AUTH_TOKEN="your-token-here"
node load-test.js

# Windows CMD
set AUTH_TOKEN=your-token-here
node load-test.js
```

## What Gets Tested

### Scenarios
1. **Health Check** (no auth)
   - Tests system availability
   - Should return 200 OK

2. **Chat Endpoint** (requires auth)
   - Tests AI chat with tool calling (Hanoi weather)
   - Validates OpenRouter integration
   - Tests conversation memory

3. **Chat with RAG** (requires auth)
   - Tests knowledge base search
   - Validates Qdrant integration
   - Tests RAG context injection

4. **Knowledge Ingestion** (requires auth)
   - Tests document upload
   - Validates Qdrant write operations
   - Tests embedding generation

### Metrics Tracked
- **Response Times**: Min, Max, Avg, P50, P95, P99
- **Success Rate**: Percentage of 2xx responses
- **Error Distribution**: By status code
- **Per-Scenario Stats**: Response times for each endpoint

## Performance Targets

✅ **Pass Criteria:**
- Average response time < 3 seconds
- P95 response time < 5 seconds
- Success rate > 90%
- No 500 errors

## Advanced Usage

### High Load Test
Test with more concurrent users:
```javascript
// Edit load-test.js
const CONFIG = {
  concurrentUsers: 50,  // Increase from 10
  totalRequests: 200,   // Increase from 50
  rampUpTime: 10000,    // 10 seconds ramp-up
};
```

### Stress Test
Find the breaking point:
```javascript
const CONFIG = {
  concurrentUsers: 100,
  totalRequests: 500,
  rampUpTime: 30000,
};
```

## Interpreting Results

### Good Performance
```
📊 Overall Metrics:
  Total Requests: 50
  Successful: 50 (100.0%)
  Failed: 0 (0.0%)

📈 Response Times (ms):
  Avg: 1200.00ms
  P95: 2800.00ms
  P99: 3500.00ms

✅ All performance checks passed!
```

### Performance Issues
```
📊 Overall Metrics:
  Total Requests: 50
  Successful: 35 (70.0%)
  Failed: 15 (30.0%)

📈 Response Times (ms):
  Avg: 6200.00ms
  P95: 12000.00ms

⚠️  Some performance checks failed
```

**Common issues:**
- High P95/P99: OpenRouter API slow or rate limited
- 401 errors: Invalid or expired auth token
- 500 errors: Backend crashes (check logs with `kubectl logs`)
- Timeouts: Insufficient resources (scale up pods)

## Monitoring During Tests

### Watch Backend Logs
```bash
kubectl logs -f deployment/week1-api-deployment
```

### Check Pod Resources
```bash
kubectl top pods -l app=week1-api
```

### Query App Insights
After running tests, check App Insights with:
```kql
customMetrics
| where name == "ai_response_time"
| where timestamp > ago(10m)
| summarize avg(value), percentiles(value, 95, 99) by bin(timestamp, 1m)
```

## Troubleshooting

### Error: ECONNREFUSED
- Backend pods not running
- Check: `kubectl get pods -l app=week1-api`

### Error: 401 Unauthorized
- Auth token expired or invalid
- Get a new token from the browser

### Error: 500 Internal Server Error
- Backend crash or misconfiguration
- Check logs: `kubectl logs deployment/week1-api-deployment`

### Slow Response Times
- OpenRouter rate limiting
- Insufficient pod resources
- Qdrant performance issues

### Scale Up if Needed
```bash
kubectl scale deployment/week1-api-deployment --replicas=3
kubectl scale deployment/week1-frontend-deployment --replicas=3
```

## Next Steps After Testing

1. ✅ Validate all metrics appear in App Insights
2. ✅ Check for errors in logs
3. ✅ Review performance against targets
4. ✅ Document any issues found
5. ✅ Make performance improvements if needed
6. ✅ Re-test after improvements
7. ✅ Proceed to production go-live
