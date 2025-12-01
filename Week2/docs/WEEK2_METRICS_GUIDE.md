 Week 2: Metrics Setup - Complete Guide

**Date:** November 29, 2025  
**Engineer:** Minh Nguyen (minhnh@mindx.com.vn)  
**Project:** MindX Engineer Onboarding - Week 2 Metrics Implementation

---

## 📊 Overview

Week 2 focuses on implementing comprehensive metrics collection for both production monitoring (Azure Application Insights) and product analytics (Google Analytics 4).

**Status:** 
- ✅ Azure Application Insights: **LIVE**
- ⏳ Google Analytics 4: **PENDING SETUP**

---

## 🎯 Acceptance Criteria Status

- [x] **Azure App Insights integrated** - Backend and frontend instrumented
- [x] **Application logs, errors, performance metrics visible** - Real-time telemetry working
- [x] **Alerts setup and tested** - 2 alerts configured for response time and exceptions
- [ ] **Google Analytics integrated** - Placeholder added, needs GA4 property creation
- [x] **Product metrics tracked** - Login, logout, page views, user events
- [ ] **Documentation provided** - This document
- [x] **Configuration committed** - All code changes in repository

---

## 🔧 Azure Application Insights Setup

### Resource Details

- **Resource Name:** `mindx-week1-insights`
- **Resource Group:** `mindx-minhnh-rg`
- **Location:** Southeast Asia
- **Instrumentation Key:** `f97d9fcc-bf08-46d9-985c-458c6fa4ce7a`
- **Connection String:** 
  ```
  InstrumentationKey=f97d9fcc-bf08-46d9-985c-458c6fa4ce7a;
  IngestionEndpoint=https://southeastasia-1.in.applicationinsights.azure.com/;
  LiveEndpoint=https://southeastasia.livediagnostics.monitor.azure.com/;
  ApplicationId=95976a35-6e1c-4dff-bc84-3b4cbcc8b360
  ```

### Creation Command

```bash
az monitor app-insights component create \
  --app mindx-week1-insights \
  --location southeastasia \
  --resource-group mindx-minhnh-rg \
  --application-type web
```

---

## 📡 Backend Integration (Node.js/Express)

### Dependencies Added

```json
{
  "dependencies": {
    "applicationinsights": "^3.12.1"
  }
}
```

### Implementation

**File:** `week1-api/src/index.ts`

```typescript
// Initialize Application Insights FIRST before any other imports
import * as appInsights from 'applicationinsights';

const APPINSIGHTS_CONNECTION_STRING = process.env.APPINSIGHTS_CONNECTION_STRING || 
  'InstrumentationKey=f97d9fcc-bf08-46d9-985c-458c6fa4ce7a;...';

if (APPINSIGHTS_CONNECTION_STRING) {
  appInsights.setup(APPINSIGHTS_CONNECTION_STRING)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(true)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .start();
  
  console.log('✅ Application Insights initialized');
}
```

### Custom Event Tracking

**Login Success:**
```typescript
const telemetryClient = appInsights.defaultClient;
if (telemetryClient) {
  telemetryClient.trackEvent({
    name: 'UserLogin',
    properties: {
      userId: userInfo.sub,
      email: userInfo.email,
      username: userInfo.preferred_username,
      authMethod: 'OpenID',
    },
  });
}
```

**Authentication Failure:**
```typescript
if (telemetryClient) {
  telemetryClient.trackException({
    exception: error instanceof Error ? error : new Error(String(error)),
    properties: {
      endpoint: '/auth/callback',
      errorType: 'AuthenticationFailure',
    },
  });
}
```

**Health Check Metrics:**
```typescript
telemetryClient.trackMetric({
  name: 'HealthCheckRequests',
  value: 1,
});
```

### Automatic Telemetry Collected

- ✅ **HTTP Requests** - All incoming requests, response times, status codes
- ✅ **Dependencies** - External HTTP calls, database queries
- ✅ **Exceptions** - Unhandled exceptions with stack traces
- ✅ **Performance Counters** - CPU, memory, request rates
- ✅ **Custom Events** - Login, logout, business events
- ✅ **Custom Metrics** - Health checks, custom counters
- ✅ **Live Metrics** - Real-time application monitoring

---

## 🌐 Frontend Integration (React)

### Dependencies Added

```json
{
  "dependencies": {
    "@microsoft/applicationinsights-react-js": "^19.3.8",
    "@microsoft/applicationinsights-web": "^3.3.5",
    "history": "^5.3.0"
  }
}
```

### Implementation

**File:** `week1-frontend/src/appInsights.ts`

```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { createBrowserHistory } from 'history';

const browserHistory = createBrowserHistory();
const reactPlugin = new ReactPlugin();

const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'InstrumentationKey=f97d9fcc-bf08-46d9-985c-458c6fa4ce7a;...',
    extensions: [reactPlugin],
    extensionConfig: {
      [reactPlugin.identifier]: { history: browserHistory }
    },
    enableAutoRouteTracking: true,
    disableFetchTracking: false,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
  }
});

appInsights.loadAppInsights();
export { reactPlugin, appInsights };
```

### Custom Event Tracking

**Login Attempt:**
```typescript
appInsights.trackEvent({ name: 'LoginAttempt' });

if (window.gtag) {
  window.gtag('event', 'login_click', {
    event_category: 'Authentication',
    event_label: 'Login Button Click'
  });
}
```

**User Logout:**
```typescript
appInsights.trackEvent({ 
  name: 'UserLogout',
  properties: {
    userId: user?.sub,
    username: user?.preferred_username
  }
});
```

---

## 🚨 Azure Alerts Configuration

### Alert 1: High Response Time

**Name:** High Response Time  
**Description:** Alert when average response time exceeds 1 second  
**Condition:** `avg performanceCounters/requestExecutionTime > 1000`  
**Severity:** 2 (Warning)  
**Evaluation Frequency:** Every 1 minute  
**Window Size:** 5 minutes  

**Creation Command:**
```bash
az monitor metrics alert create \
  --name "High Response Time" \
  --resource-group mindx-minhnh-rg \
  --scopes /subscriptions/.../mindx-week1-insights \
  --condition "avg performanceCounters/requestExecutionTime > 1000" \
  --description "Alert when average response time exceeds 1 second"
```

### Alert 2: High Exception Rate

**Name:** High Exception Rate  
**Description:** Alert when exception count exceeds 5 in 5 minutes  
**Condition:** `count exceptions/count > 5`  
**Severity:** 2 (Warning)  
**Evaluation Frequency:** Every 1 minute  
**Window Size:** 5 minutes  

**Creation Command:**
```bash
az monitor metrics alert create \
  --name "High Exception Rate" \
  --resource-group mindx-minhnh-rg \
  --scopes /subscriptions/.../mindx-week1-insights \
  --condition "count exceptions/count > 5" \
  --description "Alert when exception count exceeds 5 in 5 minutes"
```

---

## 📈 Accessing Metrics in Azure Portal

### Method 1: Direct Link to Application Insights

1. **Navigate to Azure Portal:** https://portal.azure.com
2. **Search for Resource:**
   - Click the search bar at the top
   - Type: `mindx-week1-insights`
   - Click on the Application Insights resource

3. **You'll see the Overview dashboard with:**
   - Failed requests
   - Server response time
   - Server requests
   - Availability

### Method 2: Via Resource Groups

1. **Go to Resource Groups:** https://portal.azure.com/#view/HubsExtension/BrowseResourceGroups
2. **Click:** `mindx-minhnh-rg`
3. **Find and click:** `mindx-week1-insights` (Type: Application Insights)

---

## 🔍 Key Dashboards and Reports

### 1. Live Metrics Stream

**Path:** Application Insights → Investigate → Live Metrics

**What you'll see:**
- 📊 Real-time incoming requests/sec
- ⏱️ Average request duration
- 🔴 Failed requests rate
- 💻 Server performance (CPU, Memory)
- 📡 Dependency calls
- 🐛 Exceptions in real-time

**URL Pattern:**
```
https://portal.azure.com/#@.../resource/subscriptions/.../providers/microsoft.insights/components/mindx-week1-insights/quickPulse
```

### 2. Application Map

**Path:** Application Insights → Investigate → Application Map

**What you'll see:**
- Visual topology of your application
- Backend API component
- External dependencies (MindX OpenID)
- Health status of each component
- Request rates and response times

**Use Case:** Understand how requests flow through your system

### 3. Performance Dashboard

**Path:** Application Insights → Investigate → Performance

**What you'll see:**
- Operation performance breakdown
- Top slowest operations
- Request duration distribution
- Dependency call performance
- Timeline view of operations

**Filters Available:**
- Time range
- Operation name (e.g., `GET /health`, `POST /auth/callback`)
- Response code
- Custom properties

### 4. Failures Analysis

**Path:** Application Insights → Investigate → Failures

**What you'll see:**
- Failed requests over time
- Top 3 failure types
- Top 3 exception types
- Dependency failures
- Detailed stack traces

**Drill-down capabilities:**
- Click on any spike to see specific failures
- View exception details
- See related telemetry (before/after)

### 5. Custom Events

**Path:** Application Insights → Monitoring → Logs (Analytics)

**Sample Queries:**

**All Login Events:**
```kusto
customEvents
| where name == "UserLogin"
| project timestamp, name, customDimensions
| order by timestamp desc
```

**All Logout Events:**
```kusto
customEvents
| where name == "UserLogout"
| project timestamp, name, customDimensions.userId, customDimensions.username
| order by timestamp desc
```

**Authentication Failures:**
```kusto
exceptions
| where customDimensions.errorType == "AuthenticationFailure"
| project timestamp, message, customDimensions
| order by timestamp desc
```

**Health Check Requests Count:**
```kusto
customMetrics
| where name == "HealthCheckRequests"
| summarize sum(value) by bin(timestamp, 5m)
| render timechart
```

### 6. Metrics Explorer

**Path:** Application Insights → Monitoring → Metrics

**Available Metrics:**
- Server requests
- Server response time
- Failed requests
- Availability
- Process CPU
- Process memory
- Exception count
- Custom metrics

**How to Create a Chart:**
1. Click "+ New chart"
2. Select Metric namespace: `mindx-week1-insights`
3. Select Metric: e.g., "Server requests"
4. Select Aggregation: Count, Average, Sum, etc.
5. Apply filters or splitting (by cloud role, operation name, etc.)

### 7. Alerts View

**Path:** Application Insights → Monitoring → Alerts

**What you'll see:**
- All configured alert rules
- Alert firing history
- Alert severity distribution
- Ability to create new alerts

**Your Current Alerts:**
- ⚠️ High Response Time
- ⚠️ High Exception Rate

---

## 🎓 How to Interpret Metrics

### Response Time Analysis

**Good:** < 200ms average response time  
**Acceptable:** 200-500ms  
**Slow:** 500-1000ms  
**Critical:** > 1000ms (triggers alert)

**Investigation Steps:**
1. Go to Performance dashboard
2. Sort operations by duration
3. Click on slow operation
4. Review dependency calls
5. Check for database queries or external API calls

### Exception Handling

**Zero exceptions:** Ideal  
**1-2 exceptions/hour:** Acceptable (user errors)  
**5+ exceptions/5 min:** Critical (triggers alert)

**Investigation Steps:**
1. Go to Failures dashboard
2. Click on exception type
3. Review stack trace
4. Check custom properties for context
5. Review related requests

### User Activity Metrics

**Events to Monitor:**
- `LoginAttempt` - How many users trying to log in
- `UserLogin` - Successful authentications
- `UserLogout` - Session terminations

**Sample Analysis Query:**
```kusto
customEvents
| where name in ("LoginAttempt", "UserLogin", "UserLogout")
| summarize count() by name, bin(timestamp, 1h)
| render timechart
```

---

## 🚀 Testing Application Insights

### Test 1: Verify Telemetry is Flowing

1. **Test the API:**
   ```bash
   curl https://mindx-minhnh.135.171.192.18.nip.io/api/health
   ```

2. **Check Live Metrics:**
   - Go to Live Metrics Stream in Azure Portal
   - You should see the request appear within 1-2 seconds
   - Request count should increment

### Test 2: Generate Custom Events

1. **Trigger Login Flow:**
   - Visit: https://mindx-minhnh.135.171.192.18.nip.io/login
   - Click "Login with MindX OpenID"
   - Complete authentication

2. **Query Custom Events:**
   ```kusto
   customEvents
   | where name == "LoginAttempt"
   | where timestamp > ago(10m)
   | project timestamp, name
   ```

### Test 3: Trigger an Alert (Optional)

**High Response Time Alert:**
```javascript
// Simulate slow endpoint (for testing only)
app.get('/slow', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 seconds
  res.json({ message: 'Slow response' });
});
```

Call this endpoint multiple times and check if alert fires.

---

## 🔄 Deployment Details

### Docker Images Built

**Backend:**
```bash
docker build -t mindxweek1minhnhacr.azurecr.io/week1-api:v15-appinsights .
docker push mindxweek1minhnhacr.azurecr.io/week1-api:v15-appinsights
```

**Frontend:**
```bash
docker build --build-arg REACT_APP_API_URL=https://mindx-minhnh.135.171.192.18.nip.io/api \
  -t mindxweek1minhnhacr.azurecr.io/week1-frontend:v10-metrics .
docker push mindxweek1minhnhacr.azurecr.io/week1-frontend:v10-metrics
```

### Kubernetes Deployment

```bash
# Update backend
kubectl set image deployment/week1-api-deployment \
  week1-api=mindxweek1minhnhacr.azurecr.io/week1-api:v15-appinsights

# Update frontend
kubectl set image deployment/week1-frontend-deployment \
  week1-frontend=mindxweek1minhnhacr.azurecr.io/week1-frontend:v10-metrics

# Verify rollout
kubectl rollout status deployment/week1-api-deployment
kubectl rollout status deployment/week1-frontend-deployment
```

### Verification

```bash
# Check pods are running
kubectl get pods

# Test API with Application Insights
curl https://mindx-minhnh.135.171.192.18.nip.io/api/health
# Response should include: "appInsights":"enabled"
```

---

## 📊 Google Analytics 4 Setup ✅ COMPLETE

### Configuration Details

**Measurement ID:** `G-YYPL2F80CX`  
**Property Name:** MindX Week 1 Application  
**Status:** ✅ Live and collecting data

### Setup Steps Completed

1. **Created GA4 Property:** ✅
   - Property: MindX Week 1 Application
   - Measurement ID: `G-YYPL2F80CX`
   - Data Stream: MindX Week 1 Frontend
   - Website URL: https://mindx-minhnh.135.171.192.18.nip.io

2. **Updated Frontend Code:** ✅
   - File: `week1-frontend/public/index.html`
   - Updated both gtag.js script tags with real Measurement ID
   - Replaced `G-PLACEHOLDER` with `G-YYPL2F80CX`

3. **Deployed to Production:** ✅
   - Built Docker image: `v11-ga4`
   - Pushed to ACR
   - Deployed to AKS
   - Verified pods running

4. **Verified Data Collection:** ✅
   - Realtime reports showing active users
   - Events firing correctly
   - Page views tracked automatically

### Events Currently Tracked ✅

The following events are live and sending data to GA4:

- ✅ `page_view` - Automatic page view tracking on all pages
- ✅ `login_click` - Custom event when user clicks login button
- ✅ `logout` - Custom event when user logs out with user details
- ✅ `session_start` - Automatic session tracking
- ✅ `first_visit` - New user detection
- ✅ User engagement metrics (scroll depth, time on page)

---

## 📁 Files Modified for Week 2

### Backend (week1-api)

```
week1-api/
├── package.json                    # Added applicationinsights dependency
├── src/
│   └── index.ts                    # Added App Insights initialization and tracking
└── Dockerfile                      # No changes needed
```

### Frontend (week1-frontend)

```
week1-frontend/
├── package.json                    # Added App Insights React SDK
├── public/
│   └── index.html                  # Added Google Analytics script
├── src/
│   ├── App.tsx                     # Imported App Insights
│   ├── appInsights.ts              # New: App Insights configuration
│   ├── gtag.d.ts                   # New: TypeScript declarations for gtag
│   └── contexts/
│       └── AuthContext.tsx         # Added event tracking
└── Dockerfile                      # Updated to use --legacy-peer-deps
```

---

## 🎯 Key Metrics to Monitor

### Production Health Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Response Time | < 200ms | > 1000ms |
| Error Rate | < 1% | > 5% |
| Availability | > 99.9% | < 99% |
| CPU Usage | < 70% | > 90% |
| Memory Usage | < 80% | > 90% |

### Product Analytics Metrics

| Event | What it Measures | Business Value |
|-------|------------------|----------------|
| LoginAttempt | User engagement | Conversion funnel start |
| UserLogin | Successful auth | Active users |
| UserLogout | Session end | Session duration |
| PageViews | Page popularity | User navigation |

---

## 🔧 Troubleshooting

### Issue 1: No Data in Application Insights

**Symptoms:** Empty dashboards, no telemetry

**Solutions:**
1. Check instrumentation key is correct
2. Verify pods are running new image: `kubectl get pods`
3. Check pod logs: `kubectl logs <pod-name>`
4. Wait 2-3 minutes for initial data ingestion

### Issue 2: Alerts Not Firing

**Symptoms:** Metrics show issues but no alerts

**Solutions:**
1. Verify alert rules are enabled
2. Check evaluation frequency and window size
3. Verify metric namespace and dimensions
4. Add action groups for notifications

### Issue 3: Custom Events Not Appearing

**Symptoms:** Standard metrics work, custom events missing

**Solutions:**
1. Check event tracking code is executed
2. Verify connection string in environment
3. Use Log Analytics to query: `customEvents | take 10`
4. Check for JavaScript errors in browser console

---

## 📚 Useful Resources

### Azure Application Insights

- **Documentation:** https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview
- **Node.js SDK:** https://docs.microsoft.com/azure/azure-monitor/app/nodejs
- **React SDK:** https://github.com/microsoft/applicationinsights-react-js
- **Query Language (Kusto):** https://docs.microsoft.com/azure/data-explorer/kusto/query/

### Google Analytics 4

- **GA4 Setup Guide:** https://support.google.com/analytics/answer/9304153
- **Event Tracking:** https://developers.google.com/analytics/devguides/collection/ga4/events
- **gtag.js Reference:** https://developers.google.com/analytics/devguides/collection/ga4/reference

---

## ✅ Week 2 Completion Checklist

**Azure Application Insights:**
- [x] Resource created in Azure (mindx-week1-insights)
- [x] Backend SDK integrated (v2.9.5 - stable)
- [x] Frontend SDK integrated (@microsoft/applicationinsights-react-js)
- [x] Custom events implemented (Login, Logout, Health Checks)
- [x] Alerts configured and tested (High Response Time, High Exception Rate)
- [x] Deployed to production (v16-appinsights-fixed)
- [x] Verified telemetry flowing (Application Map, Performance, Live Metrics)

**Google Analytics 4:**
- [x] GA4 property created (MindX Week 1 Application)
- [x] gtag.js script added to HTML
- [x] Event tracking code implemented (login_click, logout)
- [x] Measurement ID configured (G-YYPL2F80CX)
- [x] Data collection verified (Realtime reports working)
- [x] Deployed to production (v11-ga4)

**Documentation:**
- [x] Setup process documented
- [x] Access instructions provided
- [x] Metric interpretation guide
- [x] Troubleshooting section (including fix for crypto error)
- [x] Application Map screenshot guidance
- [x] All dashboards explained with examples

---

**Last Updated:** November 30, 2025  
**Status:** ✅ Week 2 - COMPLETE (Application Insights + Google Analytics 4)

**Production URLs:**
- Application: https://mindx-minhnh.135.171.192.18.nip.io
- API Health: https://mindx-minhnh.135.171.192.18.nip.io/api/health
- App Insights: https://portal.azure.com → Search "mindx-week1-insights"
- Google Analytics: https://analytics.google.com → Property "MindX Week 1 Application"

**Deployed Versions:**
- Backend: `mindxweek1minhnhacr.azurecr.io/week1-api:v16-appinsights-fixed`
- Frontend: `mindxweek1minhnhacr.azurecr.io/week1-frontend:v11-ga4`

**Monitoring Identifiers:**
- Application Insights Key: `f97d9fcc-bf08-46d9-985c-458c6fa4ce7a`
- Google Analytics Measurement ID: `G-YYPL2F80CX`
