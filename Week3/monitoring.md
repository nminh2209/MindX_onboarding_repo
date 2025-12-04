# Monitoring & Troubleshooting Guide

## Monitoring Overview

The MindX AI Application uses Azure Application Insights for comprehensive monitoring and observability.

## App Insights Connection

### Verify Connection

```bash
# Check if metrics are being sent
kubectl logs -l app=week1-api | grep "Application Insights"
# Expected: ✅ Application Insights initialized
```

### Access App Insights

1. Open Azure Portal: https://portal.azure.com
2. Search for "Application Insights"
3. Select your resource (likely named with "mindx" or "week1")
4. Click "Logs" in the left menu

## Key Metrics

### AI Performance Metrics

**Query to check response times**:
```kql
customMetrics
| where name == "ai_response_time"
| where timestamp > ago(1h)
| summarize avg(value), percentiles(value, 50, 95, 99) by bin(timestamp, 5m)
| render timechart
```

**Expected Results**:
- Average: < 3000ms
- P95: < 5000ms
- P99: < 8000ms

**Token Usage**:
```kql
customMetrics
| where name in ("ai_token_usage_prompt", "ai_token_usage_completion", "ai_token_usage_total")
| where timestamp > ago(1h)
| summarize sum(value) by name, bin(timestamp, 1h)
| render barchart
```

### RAG Metrics

**Documents Retrieved**:
```kql
customEvents
| where name == "rag_usage"
| where timestamp > ago(1h)
| extend documentsRetrieved = toint(customDimensions.documentsRetrieved)
| extend topScore = todouble(customDimensions.topScore)
| summarize avg(documentsRetrieved), avg(topScore) by bin(timestamp, 5m)
```

**RAG Success Rate**:
```kql
customEvents
| where name == "rag_usage"
| where timestamp > ago(1h)
| extend success = tobool(customDimensions.success)
| summarize SuccessRate = (countif(success == true) * 100.0 / count())
```

**Expected**: > 95% success rate

### Tool Execution Metrics

**Tool Performance**:
```kql
customEvents
| where name == "tool_execution"
| where timestamp > ago(1h)
| extend toolName = tostring(customDimensions.toolName)
| extend success = tobool(customDimensions.success)
| extend duration = todouble(customDimensions.duration)
| summarize 
    Count = count(),
    SuccessRate = (countif(success == true) * 100.0 / count()),
    AvgDuration = avg(duration)
    by toolName
```

**Tool Distribution**:
```kql
customEvents
| where name == "tool_execution"
| where timestamp > ago(24h)
| extend toolName = tostring(customDimensions.toolName)
| summarize count() by toolName
| render piechart
```

### Feature Usage

**Feature Adoption**:
```kql
customEvents
| where name == "feature_usage"
| where timestamp > ago(24h)
| extend feature = tostring(customDimensions.feature)
| summarize count() by feature
| render columnchart
```

**Active Users**:
```kql
customEvents
| where name == "feature_usage"
| where timestamp > ago(24h)
| extend userId = tostring(customDimensions.userId)
| summarize UniqueUsers = dcount(userId) by bin(timestamp, 1h)
| render timechart
```

### Error Tracking

**Error Overview**:
```kql
exceptions
| where timestamp > ago(1h)
| extend errorType = tostring(customDimensions.errorType)
| summarize count() by errorType
| render barchart
```

**Recent Errors**:
```kql
exceptions
| where timestamp > ago(1h)
| project timestamp, message, customDimensions
| order by timestamp desc
| take 20
```

## Health Checks

### Application Health

**Check API Health**:
```bash
curl https://mindx-minhnh.135.171.192.18.nip.io/api/health
# Expected: {"status":"healthy"}
```

**Check Pod Health**:
```bash
kubectl get pods
# Expected: All pods Running, 2/2 or 1/1 READY
```

**Check Pod Resources**:
```bash
kubectl top pods
# Watch CPU and memory usage
```

### Component Health

**Backend Logs**:
```bash
kubectl logs -l app=week1-api --tail=50
```

**Expected patterns**:
- ✅ Application Insights initialized
- ✅ OpenID Connect client initialized
- ✅ Qdrant collection already exists
- 🚀 Week 1 API server is running

**Frontend Logs**:
```bash
kubectl logs -l app=week1-frontend --tail=20
```

**Qdrant Logs**:
```bash
kubectl logs -l app=qdrant --tail=30
```

### Ingress Health

**Check Ingress Status**:
```bash
kubectl get ingress
kubectl describe ingress week1-api-ingress
kubectl describe ingress week1-frontend-ingress
```

**Test Routing**:
```bash
# Frontend (should return HTML)
curl https://mindx-minhnh.135.171.192.18.nip.io/

# Backend (should return healthy)
curl https://mindx-minhnh.135.171.192.18.nip.io/api/health
```

## Troubleshooting

### Issue 1: High Response Times

**Symptoms**:
- Chat responses taking > 5 seconds
- P95 response time > 8 seconds

**Diagnosis**:
```kql
customMetrics
| where name == "ai_response_time"
| where timestamp > ago(1h)
| where value > 5000
| extend model = tostring(customDimensions.model)
| summarize count(), avg(value) by model
```

**Common Causes**:
1. OpenRouter API slow or rate-limited
2. Large conversation context
3. Complex RAG queries
4. Multiple tool calls

**Solutions**:
```bash
# Check if OpenRouter is slow
curl -w "\nTime: %{time_total}s\n" https://openrouter.ai/api/v1/models

# Check pod resources
kubectl top pods -l app=week1-api

# Scale up if needed
kubectl scale deployment/week1-api-deployment --replicas=4

# Check for memory/CPU throttling
kubectl describe pod <pod-name> | grep -A 5 "State:"
```

### Issue 2: Chat Failing

**Symptoms**:
- 500 errors on /api/chat
- "Chat failed" error messages

**Diagnosis**:
```bash
# Check backend logs
kubectl logs -l app=week1-api --tail=100 | grep -i error

# Check error metrics
```

```kql
exceptions
| where timestamp > ago(1h)
| where operation_Name contains "chat"
| project timestamp, message, customDimensions
```

**Common Causes**:
1. OpenRouter API key invalid/expired
2. Qdrant connection failure
3. Out of memory
4. Rate limit exceeded

**Solutions**:
```bash
# Verify OpenRouter key
kubectl get secret week1-secrets -o jsonpath='{.data.OPENROUTER_API_KEY}' | base64 --decode
# Test key manually

# Check Qdrant connection
kubectl exec -it <api-pod> -- sh
wget -O- http://qdrant:6333/collections

# Restart pods if needed
kubectl rollout restart deployment/week1-api-deployment
```

### Issue 3: RAG Not Finding Documents

**Symptoms**:
- Search queries return no results
- Low relevance scores

**Diagnosis**:
```kql
customEvents
| where name == "rag_usage"
| where timestamp > ago(1h)
| extend documentsRetrieved = toint(customDimensions.documentsRetrieved)
| where documentsRetrieved == 0
| summarize count()
```

**Common Causes**:
1. No documents in collection
2. Embedding generation failed
3. Qdrant service down
4. Query-document mismatch

**Solutions**:
```bash
# Check Qdrant collection
kubectl exec -it <qdrant-pod> -- sh
# Inside pod:
curl http://localhost:6333/collections/knowledge_base

# Check document count
curl http://qdrant:6333/collections/knowledge_base | jq '.result.points_count'

# Re-initialize collection if needed
curl -X POST https://mindx-minhnh.135.171.192.18.nip.io/api/ingest \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"documents":[{"text":"Test document"}]}'
```

### Issue 4: Tool Execution Failures

**Symptoms**:
- Weather queries fail
- Tools return errors

**Diagnosis**:
```kql
customEvents
| where name == "tool_execution"
| where timestamp > ago(1h)
| extend success = tobool(customDimensions.success)
| extend toolName = tostring(customDimensions.toolName)
| extend error = tostring(customDimensions.error)
| where success == false
| project timestamp, toolName, error
```

**Common Causes**:
1. External API down (weather API)
2. Network connectivity issues
3. Tool timeout
4. Invalid parameters

**Solutions**:
```bash
# Test weather API manually
curl "https://api.open-meteo.com/v1/forecast?latitude=21.0285&longitude=105.8542&current_weather=true"

# Check network from pod
kubectl exec -it <api-pod> -- sh
wget -O- "https://api.open-meteo.com/v1/forecast?latitude=21.0285&longitude=105.8542&current_weather=true"

# Increase timeout if needed (edit mcp-tools.ts)
```

### Issue 5: Knowledge Ingestion Failing

**Symptoms**:
- Document upload returns 500 error
- "Ingestion failed" message

**Diagnosis**:
```bash
# Check ingestion logs
kubectl logs -l app=week1-api | grep -i "ingestion"

# Check metrics
```

```kql
customEvents
| where name == "knowledge_ingestion"
| where timestamp > ago(1h)
| extend success = tobool(customDimensions.success)
| where success == false
| project timestamp, customDimensions
```

**Common Causes**:
1. Qdrant storage full
2. Embedding generation failed
3. Invalid document format
4. OpenRouter API error

**Solutions**:
```bash
# Check Qdrant storage
kubectl get pvc
kubectl describe pvc qdrant-pvc

# Check pod disk usage
kubectl exec -it <qdrant-pod> -- df -h

# Increase PVC size if needed
kubectl patch pvc qdrant-pvc -p '{"spec":{"resources":{"requests":{"storage":"10Gi"}}}}'

# Verify embeddings work
curl -X POST https://openrouter.ai/api/v1/embeddings \
  -H "Authorization: Bearer $OPENROUTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/text-embedding-3-small","input":"test"}'
```

### Issue 6: Memory Leaks

**Symptoms**:
- Pods restarting frequently
- OOMKilled status
- Increasing memory usage

**Diagnosis**:
```bash
# Check pod restarts
kubectl get pods -l app=week1-api
# Look at RESTARTS column

# Check memory usage
kubectl top pods -l app=week1-api

# Check if OOMKilled
kubectl describe pod <pod-name> | grep -A 5 "Last State"
```

**Common Causes**:
1. Conversation memory not cleaned up
2. Memory limit too low
3. Connection leaks
4. Large response buffering

**Solutions**:
```bash
# Increase memory limit
kubectl set resources deployment/week1-api-deployment \
  --limits=memory=1Gi \
  --requests=memory=512Mi

# Force conversation cleanup (edit conversation-memory.ts)
# Reduce MAX_CONTEXT_MESSAGES from 20 to 10

# Restart to clear memory
kubectl rollout restart deployment/week1-api-deployment
```

### Issue 7: Authentication Failures

**Symptoms**:
- "Authentication required" errors
- 401 Unauthorized responses

**Diagnosis**:
```bash
# Check OIDC configuration
kubectl get deployment week1-api-deployment -o yaml | grep -A 10 "env:"

# Check logs for auth errors
kubectl logs -l app=week1-api | grep -i "auth\|token"
```

**Common Causes**:
1. Invalid JWT token
2. Token expired
3. OIDC misconfiguration
4. Missing JWT_SECRET

**Solutions**:
```bash
# Verify JWT secret exists
kubectl get secret week1-secrets -o jsonpath='{.data.JWT_SECRET}' | base64 --decode

# Check OIDC endpoints
curl https://id-dev.mindx.edu.vn/.well-known/openid-configuration

# Update secret if needed
kubectl create secret generic week1-secrets \
  --from-literal=JWT_SECRET='new-secret-key' \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods
kubectl rollout restart deployment/week1-api-deployment
```

## Performance Optimization

### Scaling

**Horizontal Scaling**:
```bash
# Scale frontend
kubectl scale deployment/week1-frontend-deployment --replicas=4

# Scale backend
kubectl scale deployment/week1-api-deployment --replicas=4

# Auto-scaling (future)
kubectl autoscale deployment/week1-api-deployment \
  --min=2 --max=10 --cpu-percent=70
```

**Vertical Scaling**:
```bash
# Increase resource limits
kubectl set resources deployment/week1-api-deployment \
  --limits=cpu=1000m,memory=1Gi \
  --requests=cpu=500m,memory=512Mi
```

### Caching

Currently no caching implemented. Future improvements:
- Redis for conversation memory
- Response caching for common queries
- Embedding cache for repeated searches

### Database Optimization

```bash
# Check Qdrant performance
kubectl logs -l app=qdrant | grep -i "slow\|performance"

# Optimize index (if needed)
# Increase HNSW parameters in Qdrant config
```

## Alerting (Future)

Recommended alerts to set up:

1. **High Error Rate**: Error rate > 5% over 5 minutes
2. **Slow Responses**: P95 > 5 seconds over 5 minutes
3. **Pod Crashes**: > 3 restarts in 10 minutes
4. **High Memory**: Memory usage > 80%
5. **Low Success Rate**: Success rate < 90%

## Acceptance Criteria

### ✅ Monitoring Implementation
- [x] App Insights connected
- [x] Custom metrics tracked
- [x] Logs centralized
- [x] Health endpoints working
- [x] Query examples provided

### ✅ Troubleshooting Coverage
- [x] Common issues documented
- [x] Diagnosis steps provided
- [x] Solutions explained
- [x] Commands included
- [x] Performance optimization covered

### ✅ Operational Readiness
- [x] Health check procedures
- [x] Scaling instructions
- [x] Error investigation guide
- [x] Recovery procedures
- [x] Performance tuning tips
