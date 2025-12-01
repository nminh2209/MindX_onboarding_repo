# Quick Access: Azure Portal Metrics

**Last Updated:** November 29, 2025

---

## 🚀 Fastest Way to Access Your Metrics

### Option 1: Direct Link (Bookmark This!)

```
https://portal.azure.com/#@/resource/subscriptions/YOUR_SUBSCRIPTION/resourceGroups/mindx-minhnh-rg/providers/microsoft.insights/components/mindx-week1-insights/overview
```

**Steps:**
1. Open link above
2. Sign in to Azure Portal if needed
3. You're at your Application Insights dashboard!

---

### Option 2: Search from Azure Portal

1. **Go to:** https://portal.azure.com
2. **Click search bar** at the top (or press `/`)
3. **Type:** `mindx-week1-insights`
4. **Click:** The Application Insights resource

**Time:** ~10 seconds ⚡

---

### Option 3: Via Resource Groups

1. **Portal Home:** https://portal.azure.com
2. **Click:** Resource groups (or search "resource groups")
3. **Click:** `mindx-minhnh-rg`
4. **Find:** `mindx-week1-insights` (Type: Application Insights)
5. **Click** to open

**Time:** ~15 seconds

---

## 📊 Key Dashboards You'll Use

### 1. Overview Dashboard
**Path:** App Insights → Overview

**What you see immediately:**
- 📈 Failed requests (last 24h)
- ⏱️ Server response time
- 📊 Server requests count
- ✅ Availability percentage

**Use case:** Daily health check

---

### 2. Live Metrics Stream ⚡ (MUST TRY!)
**Path:** App Insights → Investigate → Live Metrics

**What you see:**
- Real-time requests streaming in
- Response times updating every second
- Exceptions appearing as they happen
- Server CPU/Memory usage

**How to test:**
1. Open Live Metrics
2. In another tab, visit: https://mindx-minhnh.135.171.192.18.nip.io
3. Watch the request appear in real-time! 🎉

**Pro tip:** Keep this open on second monitor during development

---

### 3. Application Map
**Path:** App Insights → Investigate → Application Map

**What you see:**
- Visual diagram of your application
- Backend API node
- External dependencies (MindX OpenID)
- Request flow between components
- Health indicators (green = good, red = issues)

**Use case:** Understanding system architecture and dependencies

---

### 4. Performance
**Path:** App Insights → Investigate → Performance

**What you see:**
- List of all API operations (GET /health, POST /auth/callback, etc.)
- Average duration for each operation
- Number of calls
- Performance trends over time

**How to drill down:**
1. Click on any operation (e.g., "GET /health")
2. See detailed performance breakdown
3. View sample requests
4. Identify slow dependencies

**Use case:** Finding performance bottlenecks

---

### 5. Failures
**Path:** App Insights → Investigate → Failures

**What you see:**
- Failed requests timeline
- Top failure types
- Exception types with counts
- Dependency failures

**How to investigate:**
1. Click on any spike in the graph
2. See all failures in that time period
3. Click individual failure for stack trace
4. View related telemetry

**Use case:** Debugging production issues

---

### 6. Logs (Analytics) - Most Powerful! 🔥
**Path:** App Insights → Monitoring → Logs

**Sample queries to run:**

**See all login events:**
```kusto
customEvents
| where name == "UserLogin"
| project timestamp, name, customDimensions
| order by timestamp desc
| take 20
```

**Count logins per hour:**
```kusto
customEvents
| where name == "UserLogin"
| summarize LoginCount = count() by bin(timestamp, 1h)
| render timechart
```

**Find authentication errors:**
```kusto
exceptions
| where customDimensions.errorType == "AuthenticationFailure"
| project timestamp, message, customDimensions
| order by timestamp desc
```

**All requests in last hour:**
```kusto
requests
| where timestamp > ago(1h)
| project timestamp, name, url, duration, resultCode
| order by timestamp desc
```

**Health check requests:**
```kusto
customMetrics
| where name == "HealthCheckRequests"
| summarize sum(value) by bin(timestamp, 5m)
| render timechart
```

---

## 🎯 Daily Metrics Checklist

**Morning Check (2 minutes):**
- [ ] Open Overview dashboard
- [ ] Check for failed requests (should be 0 or very low)
- [ ] Verify average response time < 500ms
- [ ] Check availability = 100%

**Weekly Deep Dive (10 minutes):**
- [ ] Review Performance dashboard for slow operations
- [ ] Check Failures for any recurring errors
- [ ] Run custom event queries to understand user behavior
- [ ] Review Application Map for new dependencies

**After Deployment:**
- [ ] Open Live Metrics Stream
- [ ] Test application functionality
- [ ] Watch for errors in real-time
- [ ] Verify custom events are firing

---

## 🔔 Your Active Alerts

### High Response Time
- **Threshold:** > 1000ms average
- **Window:** 5 minutes
- **Action:** Investigate Performance dashboard

### High Exception Rate
- **Threshold:** > 5 exceptions in 5 minutes
- **Window:** 5 minutes
- **Action:** Check Failures dashboard + Logs

**View alerts:** App Insights → Monitoring → Alerts

---

## 💡 Pro Tips

1. **Pin to Favorites:**
   - Click the star ⭐ next to "mindx-week1-insights" to add to favorites
   - Access from left sidebar "Favorites" section

2. **Create Custom Dashboard:**
   - Go to Azure Portal Home
   - Click "+ New dashboard"
   - Add tiles from Application Insights
   - Pin your most-used charts

3. **Mobile App:**
   - Download "Microsoft Azure" app on phone
   - View metrics on the go
   - Get push notifications for alerts

4. **Keyboard Shortcuts:**
   - `/` = Open search
   - `G + H` = Go to home
   - `G + N` = Open notifications

5. **Share with Team:**
   - Any dashboard can be shared via link
   - Set up action groups to email alerts to team

---

## 🧪 Test Your Setup

**Quick Verification:**

1. **Test API is instrumented:**
   ```bash
   curl https://mindx-minhnh.135.171.192.18.nip.io/api/health
   ```
   Response should include: `"appInsights":"enabled"`

2. **See it in Azure:**
   - Open Live Metrics Stream
   - Run curl command above
   - Watch request appear within 2 seconds ✅

3. **Verify custom events:**
   - Login to your app: https://mindx-minhnh.135.171.192.18.nip.io/login
   - Wait 1 minute
   - Run query in Logs:
     ```kusto
     customEvents
     | where name == "LoginAttempt"
     | where timestamp > ago(5m)
     ```
   - Should see your login event! ✅

---

## 📱 Mobile Quick Access

**Azure Mobile App Quick Start:**

1. Install "Microsoft Azure" from App Store / Play Store
2. Sign in with Azure account
3. Go to Resources
4. Search "mindx-week1-insights"
5. View metrics on phone!

---

## 🆘 If You Don't See Data

**Checklist:**

1. ✅ Are new pods running?
   ```bash
   kubectl get pods
   ```
   Should see pods with recent creation time

2. ✅ Is instrumentation key in environment?
   ```bash
   kubectl describe pod <pod-name> | findstr APPINSIGHTS
   ```

3. ✅ Wait 2-3 minutes after first request (initial ingestion delay)

4. ✅ Check pod logs for errors:
   ```bash
   kubectl logs <pod-name>
   ```
   Should see: "✅ Application Insights initialized"

5. ✅ Try Live Metrics instead of historical dashboards (more immediate)

---

**Need Help?** Check the full guide: `docs/WEEK2_METRICS_GUIDE.md`

**Ready to go?** Bookmark the direct link to your Application Insights! 🎯
