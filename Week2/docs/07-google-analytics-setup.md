# 7. Google Analytics 4 Setup

**Section:** Product analytics and user behavior tracking  
**Focus:** GA4 integration for frontend telemetry

---

## 🎯 Overview

**Purpose:** Track user interactions, page views, and custom events for product analytics.

**Google Analytics vs Application Insights:**

| Feature | GA4 | App Insights |
|---------|-----|--------------|
| **Primary Use** | Product analytics, user behavior | Production monitoring, performance |
| **Best For** | Marketing, UX insights | DevOps, debugging |
| **Data Retention** | 14 months (free) | 90 days (default) |
| **Custom Events** | Unlimited | Unlimited |
| **Real-time** | Yes (limited) | Yes (Live Metrics) |
| **User Tracking** | Client-side (cookies) | Server + client |

**Why Use Both?**
- **GA4:** Understand how users interact with your product
- **App Insights:** Understand how your infrastructure performs

---

## 🔧 GA4 Property Setup

### 1. Create GA4 Property

**Steps:**

1. **Go to Google Analytics**
   - Visit [https://analytics.google.com](https://analytics.google.com)
   - Sign in with Google account

2. **Create Property**
   ```
   Admin (gear icon) → Create Property
   
   Property Name: week2mindx
   Reporting Time Zone: (GMT+07:00) Bangkok
   Currency: USD
   
   Click "Next"
   ```

3. **Property Details**
   ```
   Industry Category: Technology
   Business Size: Small
   
   Click "Create"
   Accept Terms of Service
   ```

4. **Data Stream Setup**
   ```
   Choose Platform: Web
   
   Website URL: http://20.6.98.102
   Stream Name: MindX Frontend Production
   
   Click "Create stream"
   ```

5. **Get Measurement ID**
   ```
   Stream created!
   
   Measurement ID: G-YYPL2F80CX  ← Copy this
   ```

---

## 📦 Frontend Integration

### 1. Add gtag.js Script

**File:** `week1-frontend/public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="MindX Week 1 Authentication App" />
    
    <!-- Google Analytics 4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-YYPL2F80CX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-YYPL2F80CX');
    </script>
    
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>Week 1 MindX Frontend</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

**What this does:**
1. Loads gtag.js library from Google CDN
2. Initializes GA4 with measurement ID `G-YYPL2F80CX`
3. Automatically tracks page views
4. Sets up `window.gtag()` function for custom events

---

### 2. TypeScript Declaration

**File:** `week1-frontend/src/gtag.d.ts`

```typescript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'set',
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

export {};
```

**Purpose:** Enables TypeScript to recognize `window.gtag()` without errors.

---

### 3. Custom Event Tracking

**File:** `week1-frontend/src/contexts/AuthContext.tsx`

```typescript
import React, { createContext, useState, useEffect } from 'react';
import { appInsights } from '../appInsights';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ... context setup ...

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const login = async () => {
    console.log('Redirecting to login...');
    
    // Track in App Insights
    appInsights.trackEvent({ name: 'LoginAttempt' });
    
    // Track in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'login_click', {
        event_category: 'Authentication',
        event_label: 'Login Button Click'
      });
    }
    
    window.location.href = `${API_URL}/auth/login`;
  };

  const logout = () => {
    console.log('Logging out...');
    
    // Track in App Insights
    appInsights.trackEvent({ 
      name: 'UserLogout',
      properties: {
        userId: user?.sub,
        username: user?.preferred_username
      }
    });
    
    // Track in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'logout', {
        event_category: 'Authentication',
        event_label: 'Logout Button Click',
        user_id: user?.sub
      });
    }
    
    setUser(null);
    localStorage.removeItem('user');
  };

  // ... rest of context ...

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 📊 Events Tracked Automatically

### Page Views

**What:** Every page/route change

**Example:**
```
Page: /
Page: /dashboard
Page: /profile
```

**GA4 Dashboard:**
```
Pages and screens → Events → page_view
```

### Session Start

**What:** User opens app

**Triggered by:** First interaction

**Metrics collected:**
- Session ID
- User agent
- Geographic location
- Device type

### User Engagement

**What:** Active users on site

**Metrics:**
- Engaged sessions (> 10 seconds)
- Engagement rate
- Average engagement time

---

## 🎯 Custom Events

### Events We Track

| Event | Trigger | Parameters |
|-------|---------|------------|
| `login_click` | User clicks Login button | event_category, event_label |
| `logout` | User clicks Logout button | event_category, event_label, user_id |

### Event Schema

**Login Click:**
```javascript
gtag('event', 'login_click', {
  event_category: 'Authentication',  // Group of events
  event_label: 'Login Button Click', // Specific action
});
```

**Logout:**
```javascript
gtag('event', 'logout', {
  event_category: 'Authentication',
  event_label: 'Logout Button Click',
  user_id: 'user-123'  // Track specific user
});
```

### Adding More Events

**Example: Track feature usage**

```typescript
// In feature component
const handleFeatureClick = () => {
  if (window.gtag) {
    window.gtag('event', 'feature_used', {
      event_category: 'Features',
      event_label: 'Dark Mode Toggle',
      value: 1
    });
  }
  
  // Feature logic...
};
```

**Example: Track errors**

```typescript
// In error boundary
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  if (window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message,
      fatal: false
    });
  }
}
```

---

## 🔍 GA4 Dashboard Navigation

### Real-time Report

**Location:** Reports → Realtime

**Shows:**
- Users active right now
- Page views in last 30 minutes
- Events in last 30 minutes
- User locations
- Traffic sources

**Use Cases:**
- ✅ Verify tracking after deployment
- ✅ Test custom events immediately
- ✅ Monitor traffic spikes

### Events Report

**Location:** Reports → Engagement → Events

**Shows:**
```
Event Name         | Event Count | Users
──────────────────────────────────────────
page_view          | 1,234      | 456
login_click        | 89         | 67
logout             | 78         | 65
session_start      | 456        | 456
```

**Drill-down:**
- Click event name → See parameters
- View by date range
- Filter by user properties

### Pages Report

**Location:** Reports → Engagement → Pages and screens

**Shows:**
```
Page Path     | Views | Users | Avg Time
───────────────────────────────────────────
/             | 856   | 345   | 1m 23s
/dashboard    | 234   | 156   | 2m 45s
/profile      | 123   | 89    | 1m 12s
```

### User Acquisition

**Location:** Reports → Acquisition → User acquisition

**Shows:**
- How users found your app
- Traffic sources (direct, referral, organic)
- Campaign tracking (if UTM parameters used)

---

## 🛠️ Deployment

### 1. Build Frontend

```bash
cd week1-frontend

# Build production bundle with GA4
docker build -t week1-frontend:v11-ga4 .
```

### 2. Push to ACR

```bash
# Tag for Azure Container Registry
docker tag week1-frontend:v11-ga4 mindxweek1.azurecr.io/week1-frontend:v11-ga4

# Push
docker push mindxweek1.azurecr.io/week1-frontend:v11-ga4
```

### 3. Update Kubernetes

**File:** `frontend-deployment.yaml`

```yaml
spec:
  template:
    spec:
      containers:
      - name: frontend
        image: mindxweek1.azurecr.io/week1-frontend:v11-ga4  # Updated version
```

```bash
kubectl apply -f frontend-deployment.yaml
kubectl rollout status deployment/frontend
```

---

## ✅ Verification

### 1. Check Browser DevTools

**Steps:**

1. Open app: `http://20.6.98.102`
2. Open DevTools (F12)
3. Go to Network tab
4. Filter: `google-analytics.com`

**Expected:**
```
Request URL: https://www.google-analytics.com/g/collect?...
Status: 200 OK
Payload: Contains measurement_id=G-YYPL2F80CX
```

### 2. Check GA4 Realtime

**Steps:**

1. Go to [GA4 Realtime Report](https://analytics.google.com/analytics/web/#/p123456789/realtime)
2. Open app in another tab
3. Navigate between pages

**Expected:**
```
Users active now: 1
Event count (last 30 min): 5
  - page_view: 3
  - session_start: 1
  - first_visit: 1
```

### 3. Test Custom Events

**Steps:**

1. Click "Login" button
2. Wait 30 seconds
3. Check GA4 Realtime → Events

**Expected:**
```
Event: login_click
Count: 1
Parameters:
  - event_category: Authentication
  - event_label: Login Button Click
```

### 4. Check DebugView (Optional)

**Enable:**

```javascript
// In index.html, add debug_mode
gtag('config', 'G-YYPL2F80CX', {
  debug_mode: true  // Only for testing!
});
```

**Access:**
```
GA4 → Admin → DebugView
```

**Shows:**
- Real-time events with full parameters
- Validation errors
- Parameter values

**Remember:** Remove `debug_mode: true` before production!

---

## 🎓 Best Practices

### 1. Use Consistent Event Naming

✅ **DO:**
```javascript
gtag('event', 'login_click');      // Snake case
gtag('event', 'signup_complete');  // Consistent pattern
gtag('event', 'purchase_complete');
```

❌ **DON'T:**
```javascript
gtag('event', 'loginClick');       // Camel case
gtag('event', 'SignUpComplete');   // Pascal case
gtag('event', 'PURCHASE-COMPLETE'); // Screaming kebab case
```

### 2. Include Meaningful Parameters

✅ **DO:**
```javascript
gtag('event', 'purchase', {
  value: 99.99,
  currency: 'USD',
  transaction_id: 'txn_123',
  items: [{name: 'Product A', quantity: 1}]
});
```

❌ **DON'T:**
```javascript
gtag('event', 'purchase');  // Missing valuable context
```

### 3. Respect User Privacy

**Considerations:**
- Don't track PII (email, phone, full name) without consent
- Use anonymization for IP addresses
- Implement cookie consent banner
- Provide opt-out mechanism

**Example cookie consent:**

```typescript
// Check consent before tracking
if (localStorage.getItem('ga_consent') === 'granted') {
  gtag('config', 'G-YYPL2F80CX');
} else {
  gtag('config', 'G-YYPL2F80CX', {
    anonymize_ip: true,
    storage: 'none'
  });
}
```

### 4. Don't Over-Track

✅ **DO:** Track business-critical events  
❌ **DON'T:** Track every mouse movement

**Good events:**
- User signup
- Feature adoption
- Purchase completion
- Error encountered

**Bad events:**
- Mouse moved
- Scroll position changed every pixel
- Button hovered

---

## 📈 Advanced Features

### User Properties

**Set once per user:**

```javascript
gtag('set', 'user_properties', {
  subscription_tier: 'premium',
  signup_date: '2025-01-15',
  preferred_language: 'en'
});
```

**Use for segmentation:**
- Premium vs free users
- New vs returning users
- Geographic cohorts

### E-commerce Tracking

**If you have purchases:**

```javascript
gtag('event', 'purchase', {
  transaction_id: 'T12345',
  value: 99.99,
  currency: 'USD',
  tax: 10.00,
  shipping: 5.00,
  items: [
    {
      item_id: 'SKU_123',
      item_name: 'Product Name',
      quantity: 1,
      price: 84.99
    }
  ]
});
```

### Custom Dimensions

**Beyond default parameters:**

```javascript
gtag('event', 'login_click', {
  event_category: 'Authentication',
  dimension1: 'oauth_provider',  // Custom dimension
  dimension2: 'mobile_app'       // Custom dimension
});
```

**Configure in GA4:**
```
Admin → Custom Definitions → Create custom dimension
```

---

## ✅ GA4 Setup Checklist

- [x] GA4 property created
- [x] Measurement ID obtained (G-YYPL2F80CX)
- [x] gtag.js script added to index.html
- [x] TypeScript declarations created (gtag.d.ts)
- [x] Custom events in AuthContext (login_click, logout)
- [x] Frontend built with GA4 (v11-ga4)
- [x] Deployed to production
- [x] Verified in browser DevTools
- [x] Verified in GA4 Realtime report
- [ ] Cookie consent banner (optional, for EU compliance)
- [ ] Additional custom events (optional)

---

## 🔗 Next Steps

- **Deploy to Production** → [Deployment Guide](./08-deployment-guide.md)
- **Test Integration** → [Testing Verification Guide](./09-testing-verification.md)
- **Monitor Results** → Check GA4 daily for insights

---

**Next:** [Deployment Guide →](./08-deployment-guide.md)

[← Back to Index](./README.md) | [← Previous: Metrics Interpretation](./06-metrics-interpretation.md)
