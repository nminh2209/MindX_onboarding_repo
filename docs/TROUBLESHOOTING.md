# Troubleshooting Guide

**Purpose:** Solutions to common issues encountered during Week 1 implementation  
**Status:** Based on 5 major issues resolved during deployment

---

## 🐛 Resolved Production Issues

### Issue #1: Kubernetes Image Caching

**Symptom:**
- Deployed new Docker images to ACR
- Updated Kubernetes deployment with new tag
- Pods still running old code

**Root Cause:**
- `imagePullPolicy: IfNotPresent` caused Kubernetes to use cached images
- Even with new tags, pods served stale images from node cache

**Solution:**
```bash
# 1. Use specific image digests instead of tags
docker push mindxweek1minhnhacr.azurecr.io/week1-frontend:v9
# Note the digest: sha256:94a6fc383a7ed5d9...

# 2. Deploy with digest
kubectl set image deployment/week1-frontend-deployment \
  week1-frontend=mindxweek1minhnhacr.azurecr.io/week1-frontend@sha256:94a6fc383a7ed5d9...

# 3. Set imagePullPolicy to Always
kubectl patch deployment week1-frontend-deployment -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"week1-frontend","imagePullPolicy":"Always"}]}}}}'

# 4. Force pod restart
kubectl delete pod -l app=week1-frontend
```

**Prevention:**
```yaml
# In deployment.yaml
spec:
  containers:
  - name: week1-frontend
    image: mindxweek1minhnhacr.azurecr.io/week1-frontend@sha256:...
    imagePullPolicy: Always  # Always pull latest
```

---

### Issue #2: Browser Caching Old JavaScript

**Symptom:**
- New frontend deployed to Kubernetes
- Pods showing new code in logs
- Browser still displaying old UI

**Root Cause:**
- Browser cached JavaScript bundles
- Service workers caching old assets
- No cache-busting headers configured

**Solution:**
```bash
# For users experiencing old UI:
# 1. Hard refresh
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# 2. Use incognito/private mode
Ctrl + Shift + N (Chrome)
Ctrl + Shift + P (Firefox)

# 3. Clear browser cache
Settings → Privacy → Clear browsing data → Cached images and files

# For developers:
# Add cache headers in nginx.conf
add_header Cache-Control "no-cache, no-store, must-revalidate";
add_header Pragma "no-cache";
add_header Expires "0";
```

**Prevention:**
```nginx
# nginx.conf for React apps
location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Never cache index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

---

### Issue #3: Ingress Path Conflicts

**Symptom:**
- Frontend route `/auth-landing` returns 404: "Cannot GET /auth-landing"
- Authentication callback fails
- Backend receives request instead of frontend

**Root Cause:**
- Multiple ingress resources with overlapping paths
- `week1-auth-ingress` with path `/auth` catches `/auth-landing` requests
- Ingress path matching happens before frontend routing

**Diagnosis:**
```bash
# List all ingress resources
kubectl get ingress

# Found conflicting ingress:
# NAME                  HOSTS                                     PATHS
# week1-auth-ingress    mindx-minhnh.135.171.192.18.nip.io       /auth
# week1-frontend-ingress mindx-minhnh.135.171.192.18.nip.io      /
```

**Solution:**
```bash
# Delete conflicting ingress
kubectl delete ingress week1-auth-ingress

# Verify only 2 ingresses remain
kubectl get ingress
# week1-frontend-ingress  /
# week1-api-ingress       /api
```

**Prevention:**
```yaml
# Use specific paths for backend, generic for frontend
# Backend ingress - specific paths
- path: /api(/|$)(.*)
  pathType: ImplementationSpecific

# Frontend ingress - catch-all (must be last)
- path: /
  pathType: Prefix
```

---

### Issue #4: Backend Authentication Error

**Symptom:**
- Login redirects to MindX OpenID
- Callback fails with error: "oidcClient.authorizationUrl is not a function"
- 500 Internal Server Error

**Root Cause:**
- Using incorrect `openid-client` v6 API
- `authorizationUrl()` method doesn't exist in new version
- Need to manually construct authorization URL

**Solution:**
```typescript
// BEFORE (incorrect for v6):
const authUrl = oidcClient.authorizationUrl({
  scope: 'openid email profile',
  state: state,
});

// AFTER (correct for v6):
const params = new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope: 'openid email profile',
  state: state,
});
const authUrl = `${authorizationEndpoint}?${params.toString()}`;
```

**Deployment:**
```bash
# Rebuild with --no-cache to ensure fresh code
docker build --no-cache -t mindxweek1minhnhacr.azurecr.io/week1-api:v14 .
docker push mindxweek1minhnhacr.azurecr.io/week1-api:v14

# Deploy with digest
kubectl set image deployment/week1-api-deployment \
  week1-api=mindxweek1minhnhacr.azurecr.io/week1-api@sha256:...
```

---

### Issue #5: Login Page Blank

**Symptom:**
- Visiting `/login` shows completely blank white page
- No errors in console
- Issue persists in incognito mode

**Root Cause:**
- AuthContext `login()` function incorrect URL construction:
  ```typescript
  window.location.href = `${API_BASE_URL.replace('/api', '')}/auth/login`;
  ```
- Removes `/api` from URL: `https://domain.com/auth/login`
- Should be: `https://domain.com/api/auth/login`
- Frontend receives request, no route matches, blank page

**Solution:**
```typescript
// BEFORE (incorrect):
const login = () => {
  window.location.href = `${API_BASE_URL.replace('/api', '')}/auth/login`;
};

// AFTER (correct):
const login = () => {
  window.location.href = `${API_BASE_URL}/auth/login`;
  // Results in: https://domain.com/api/auth/login
};
```

**Additional Fixes:**
```typescript
// Added loading state
if (authLoading) {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Loading...</h1>
        <p>Checking authentication status</p>
      </div>
    </div>
  );
}

// Added auto-redirect for authenticated users
useEffect(() => {
  if (!authLoading && isAuthenticated) {
    navigate('/dashboard');
  }
}, [isAuthenticated, authLoading, navigate]);
```

---

## 🔧 Common Development Issues

### Environment Variables Not Working

**Symptom:**
- React app can't connect to API
- `undefined` for `process.env.REACT_APP_API_URL`

**Solution:**
```dockerfile
# Dockerfile - Set at build time
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build command
docker build --build-arg REACT_APP_API_URL=https://domain.com/api .
```

**Important:**
- React env vars must be set at BUILD time, not runtime
- Must be prefixed with `REACT_APP_`
- Rebuilding is required after changing env vars

---

### CORS Errors

**Symptom:**
```
Access to fetch at 'https://api.com/endpoint' from origin 'https://app.com' 
has been blocked by CORS policy
```

**Solution:**
```typescript
// Backend - Add CORS headers
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

---

### 502 Bad Gateway

**Symptom:**
- Ingress returns 502 error
- Backend pods are running

**Diagnosis:**
```bash
# Check pod logs
kubectl logs -l app=week1-api --tail=50

# Check service endpoints
kubectl get endpoints week1-api-service

# Check pod status
kubectl describe pod <pod-name>
```

**Common Causes:**
1. Wrong port in service configuration
2. App not listening on 0.0.0.0
3. Health check failing
4. App crashed but pod running

**Solution:**
```typescript
// Ensure app listens on 0.0.0.0, not localhost
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

### Certificate Not Issuing

**Symptom:**
- Certificate stuck in "Pending" state
- Ingress shows default self-signed cert

**Diagnosis:**
```bash
kubectl describe certificate mindx-tls-cert
kubectl describe certificaterequest <request-name>
kubectl logs -n cert-manager -l app=cert-manager
```

**Common Causes:**
1. DNS not resolving to ingress IP
2. HTTP-01 challenge blocked
3. Let's Encrypt rate limit
4. Incorrect cluster issuer

**Solution:**
```bash
# Verify DNS resolution
nslookup mindx-minhnh.135.171.192.18.nip.io

# Check if ingress is accessible
curl http://mindx-minhnh.135.171.192.18.nip.io

# Delete and recreate certificate
kubectl delete certificate mindx-tls-cert
kubectl apply -f k8s/ingress-tls.yaml
```

---

### Pods Crashing (CrashLoopBackOff)

**Diagnosis:**
```bash
# View pod events
kubectl describe pod <pod-name>

# View logs from crashed container
kubectl logs <pod-name> --previous

# Interactive debugging
kubectl run debug --rm -it --image=busybox -- sh
```

**Common Causes:**
1. Missing environment variables
2. Incorrect entrypoint/command
3. File not found errors
4. Port already in use
5. Out of memory

---

## 🔍 Debugging Techniques

### Check Image Running in Pod
```bash
kubectl get pod <pod-name> -o jsonpath="{.spec.containers[0].image}"
```

### Exec into Running Pod
```bash
kubectl exec -it <pod-name> -- /bin/sh
```

### Port Forward for Local Testing
```bash
kubectl port-forward svc/week1-api-service 3000:3000
curl http://localhost:3000/health
```

### Check Events
```bash
kubectl get events --sort-by='.lastTimestamp'
```

### View All Resources
```bash
kubectl get all -A
```

---

## 📚 Verification Checklist

After deploying changes, verify:

- [ ] Pods are running: `kubectl get pods`
- [ ] Correct image deployed: `kubectl describe pod <pod-name> | grep Image`
- [ ] Service has endpoints: `kubectl get endpoints`
- [ ] Ingress has address: `kubectl get ingress`
- [ ] Certificate is ready: `kubectl get certificate`
- [ ] Frontend loads in browser (incognito mode)
- [ ] API health endpoint returns 200
- [ ] Authentication flow works end-to-end
- [ ] No errors in browser console
- [ ] No errors in pod logs

---

## 🔗 Related Documentation

- [Production Status](./PRODUCTION_STATUS.md) - Current deployment status
- [Infrastructure](./INFRASTRUCTURE.md) - Resource configurations
- [Auth Flow](./AUTH_FLOW.md) - Authentication troubleshooting

---

**Last Updated:** November 28, 2025  
**Issues Resolved:** 5/5 Major Production Issues
