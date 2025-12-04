# Production Monitoring Setup

## App Insights Dashboards

### 1. AI Performance Dashboard

**KQL Queries:**

```kql
// AI Response Times - Trend
customMetrics
| where name == "ai_response_time"
| summarize avg(value), percentiles(value, 50, 90, 95, 99) by bin(timestamp, 5m)
| render timechart

// Token Usage - Aggregated
customMetrics
| where name in ("ai_token_usage_prompt", "ai_token_usage_completion", "ai_token_usage_total")
| summarize sum(value) by name, bin(timestamp, 1h)
| render barchart

// AI Success Rate
customMetrics
| where name == "ai_response_time"
| extend success = tobool(customDimensions.success)
| summarize SuccessCount = countif(success == true), TotalCount = count() by bin(timestamp, 5m)
| extend SuccessRate = (SuccessCount * 100.0 / TotalCount)
| render timechart
```

### 2. Feature Usage Dashboard

**KQL Queries:**

```kql
// Feature Usage - Breakdown
customEvents
| where name == "feature_usage"
| extend feature = tostring(customDimensions.feature)
| summarize count() by feature, bin(timestamp, 1h)
| render columnchart

// Chat Sessions
customEvents
| where name == "chat_session"
| extend userId = tostring(customDimensions.userId)
| summarize sessions = count(), unique_users = dcount(userId) by bin(timestamp, 1h)
| render timechart

// RAG Search Activity
customEvents
| where name == "feature_usage" and customDimensions.feature == "rag_search"
| summarize count() by bin(timestamp, 5m)
| render timechart

// Tool Execution Frequency
customEvents
| where name == "tool_execution"
| extend toolName = tostring(customDimensions.toolName)
| summarize count() by toolName, bin(timestamp, 1h)
| render columnchart
```

### 3. Error & Health Dashboard

**KQL Queries:**

```kql
// AI Errors - Breakdown
exceptions
| where customDimensions.errorType != ""
| extend errorType = tostring(customDimensions.errorType)
| summarize count() by errorType, bin(timestamp, 5m)
| render barchart

// Tool Execution Failures
customEvents
| where name == "tool_execution"
| extend success = tobool(customDimensions.success)
| extend toolName = tostring(customDimensions.toolName)
| where success == false
| summarize count() by toolName, bin(timestamp, 5m)
| render timechart

// RAG Usage - Success vs Failure
customEvents
| where name == "rag_usage"
| extend success = tobool(customDimensions.success)
| summarize SuccessCount = countif(success == true), FailureCount = countif(success == false) by bin(timestamp, 5m)
| render timechart

// System Health
customEvents
| where name == "system_health"
| extend component = tostring(customDimensions.component), healthy = tobool(customDimensions.healthy)
| summarize HealthyCount = countif(healthy == true), UnhealthyCount = countif(healthy == false) by component, bin(timestamp, 5m)
```

### 4. RAG Performance Dashboard

**KQL Queries:**

```kql
// RAG Documents Retrieved
customEvents
| where name == "rag_usage"
| extend documentsRetrieved = toint(customDimensions.documentsRetrieved)
| summarize avg(documentsRetrieved), max(documentsRetrieved) by bin(timestamp, 5m)
| render timechart

// RAG Relevance Scores
customEvents
| where name == "rag_usage"
| extend topScore = todouble(customDimensions.topScore)
| summarize avg(topScore), percentiles(topScore, 50, 90, 95) by bin(timestamp, 5m)
| render timechart

// Knowledge Ingestion Metrics
customMetrics
| where name == "knowledge_ingestion_duration"
| extend documentCount = toint(customDimensions.documentCount), success = tobool(customDimensions.success)
| summarize avg(value), count() by success, bin(timestamp, 1h)
| render barchart
```

## Alert Rules

### Critical Alerts

**1. High Error Rate Alert**
- **Condition**: Error rate > 5% over 5 minutes
- **KQL Query**:
```kql
exceptions
| summarize ErrorCount = count() by bin(timestamp, 5m)
| join kind=leftouter (
    requests
    | summarize RequestCount = count() by bin(timestamp, 5m)
) on timestamp
| extend ErrorRate = (ErrorCount * 100.0 / RequestCount)
| where ErrorRate > 5
```
- **Severity**: Sev 1 (Critical)
- **Action**: Email + SMS to on-call engineer

**2. AI Response Time Degradation**
- **Condition**: P95 response time > 5 seconds over 5 minutes
- **KQL Query**:
```kql
customMetrics
| where name == "ai_response_time"
| summarize percentile_95 = percentiles(value, 95) by bin(timestamp, 5m)
| where percentile_95 > 5000
```
- **Severity**: Sev 2 (Warning)
- **Action**: Email to team

**3. Tool Execution Failures**
- **Condition**: > 10 tool failures per hour
- **KQL Query**:
```kql
customEvents
| where name == "tool_execution" and customDimensions.success == "false"
| summarize count() by bin(timestamp, 1h)
| where count_ > 10
```
- **Severity**: Sev 2 (Warning)
- **Action**: Email to team

**4. RAG Failure Rate**
- **Condition**: RAG failure rate > 20% over 15 minutes
- **KQL Query**:
```kql
customEvents
| where name == "rag_usage"
| extend success = tobool(customDimensions.success)
| summarize SuccessCount = countif(success == true), TotalCount = count() by bin(timestamp, 15m)
| extend FailureRate = ((TotalCount - SuccessCount) * 100.0 / TotalCount)
| where FailureRate > 20
```
- **Severity**: Sev 2 (Warning)
- **Action**: Email to team

### Warning Alerts

**5. Token Usage Spike**
- **Condition**: Token usage > 100k per hour
- **KQL Query**:
```kql
customMetrics
| where name == "ai_token_usage_total"
| summarize sum(value) by bin(timestamp, 1h)
| where sum_value > 100000
```
- **Severity**: Sev 3 (Info)
- **Action**: Email for cost monitoring

**6. Low Activity Alert**
- **Condition**: < 5 requests per hour (potential downtime)
- **KQL Query**:
```kql
requests
| summarize count() by bin(timestamp, 1h)
| where count_ < 5
```
- **Severity**: Sev 3 (Info)
- **Action**: Email to team

## Dashboard Creation Steps

### Azure Portal Setup

1. **Navigate to App Insights**
   - Open Azure Portal: https://portal.azure.com
   - Search for your App Insights resource
   - Resource name: `mindx-week1-minhnh-insights` (or similar)

2. **Create Custom Dashboard**
   - Click "Dashboards" in left menu
   - Click "+ New dashboard"
   - Name: "MindX AI Application - Production Monitoring"

3. **Add Tiles for Each Dashboard Section**

   **IMPORTANT: How to Add Log Queries as Tiles**
   - In the dashboard edit mode, click **"+ Add"** at the top
   - Select **"Tile Gallery"** from the dropdown
   - In the Tile Gallery, scroll down to find **"Logs"** tile (it's a chart icon with "Logs" label)
   - OR: Click **"Markdown"** to add text/headers between sections
   
   **Alternative Method (Easier):**
   - Go to your App Insights resource
   - Click **"Logs"** in the left menu
   - Paste your KQL query and run it
   - Click the **"Pin to dashboard"** button (pin icon) at the top-right of results
   - Select your dashboard or create a new one
   - This automatically creates the tile!
   
   **AI Performance Section:**
   - Use "Pin to dashboard" method from Logs view
   - Paste AI response time query
   - Set tile title: "AI Response Times (P50/P90/P95)"
   - Repeat for token usage query
   - Repeat for success rate query

   **Feature Usage Section:**
   - Add "Logs" tile for feature breakdown
   - Add tile for chat sessions
   - Add tile for RAG activity
   - Add tile for tool execution

   **Error & Health Section:**
   - Add "Logs" tile for AI errors
   - Add tile for tool failures
   - Add tile for RAG success/failure
   - Add tile for system health

   **RAG Performance Section:**
   - Add "Logs" tile for documents retrieved
   - Add tile for relevance scores
   - Add tile for ingestion metrics

4. **Configure Auto-Refresh**
   - Click dashboard settings
   - Set auto-refresh to 5 minutes
   - Save dashboard

### Alert Creation

1. **Create Alert Rules**
   - Go to "Alerts" in App Insights
   - Click "+ Create" → "Alert rule"
   - For each alert:
     - Set scope: Your App Insights resource
     - Add condition: Custom log query
     - Paste KQL query from above
     - Set threshold and frequency
     - Add action group (email/SMS)
     - Set severity level
     - Name and create rule

2. **Test Alerts**
   - Generate test traffic to trigger alerts
   - Verify notifications received
   - Adjust thresholds if needed

## Monitoring Best Practices

### Daily Checks
- Review error dashboard for anomalies
- Check AI performance trends
- Monitor token usage for cost control
- Verify system health status

### Weekly Reviews
- Analyze feature usage patterns
- Review alert history and false positives
- Check RAG relevance score trends
- Optimize based on performance data

### Monthly Analysis
- Compare month-over-month metrics
- Identify seasonal patterns
- Plan capacity adjustments
- Review and update alert thresholds

## Metrics Reference

### Custom Metrics
- `ai_response_time`: AI API response duration in ms
- `ai_token_usage_prompt`: Prompt tokens consumed
- `ai_token_usage_completion`: Completion tokens consumed
- `ai_token_usage_total`: Total tokens consumed
- `tool_execution_duration`: Tool execution time in ms
- `knowledge_ingestion_duration`: Ingestion operation time in ms

### Custom Events
- `feature_usage`: User feature interaction tracking
- `chat_session`: Chat session metadata
- `rag_usage`: RAG search operations
- `tool_execution`: MCP tool execution
- `system_health`: Component health status
- `knowledge_ingestion`: Document ingestion operations

### Custom Dimensions
- `model`: AI model used (e.g., "gpt-4o-mini")
- `userId`: User identifier
- `toolName`: MCP tool name
- `feature`: Feature identifier
- `success`: Operation success boolean
- `errorType`: Error classification
- `component`: System component name
- `documentsRetrieved`: Number of RAG results
- `topScore`: Best relevance score
- `documentCount`: Ingestion batch size

## Cost Optimization

### App Insights Data Retention
- Default: 90 days
- Recommendation: Keep critical metrics for 180 days
- Archive older data to Storage Account for compliance

### Sampling Configuration
- Current: No sampling (100% data retention)
- For high-traffic scenarios: Enable adaptive sampling
- Recommendation: Keep 100% for first month, evaluate later

### Query Optimization
- Use `summarize` to reduce result set size
- Filter by time range before aggregation
- Use `project` to limit returned columns
- Cache frequently-used queries in dashboard

## Next Steps

1. ✅ Deploy v26-production with metrics
2. 🔄 Create dashboards in Azure Portal (IN PROGRESS)
3. ⏳ Configure alert rules
4. ⏳ Run load tests to validate metrics
5. ⏳ Document operational runbook
6. ⏳ Train team on dashboard usage
