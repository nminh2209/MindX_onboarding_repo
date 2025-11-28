# Week 1 Q&A - Task Answers

**Date:** November 28, 2025  
**Engineer:** Minh Nguyen (minhnh@mindx.com.vn)  
**Project:** MindX Engineer Onboarding - Week 1 Full-Stack Application

---

## ✅ Acceptance Criteria Status

All Week 1 acceptance criteria have been successfully met:

- [x] **Back-end API deployed** - Accessible via https://mindx-minhnh.135.171.192.18.nip.io/api
- [x] **Front-end React web app deployed** - Accessible via https://mindx-minhnh.135.171.192.18.nip.io
- [x] **HTTPS enforced** - All endpoints use Let's Encrypt SSL with auto-redirect
- [x] **OpenID authentication integrated** - Using https://id-dev.mindx.edu.vn
- [x] **Login/Logout functional** - Users can authenticate via MindX OpenID
- [x] **Protected routes working** - Dashboard and profile require authentication
- [x] **Token validation implemented** - Backend validates JWT tokens
- [x] **Azure Cloud infrastructure** - Running on AKS with ACR
- [x] **Deployment configs committed** - All manifests in repository
- [x] **Documentation provided** - Comprehensive guides in `Week1/docs/`

---

## 📋 Quick Reference

For detailed documentation, see the [Documentation Hub](../README.md):

- **[Production Status](./PRODUCTION_STATUS.md)** - Live deployment info
- **[Auth Flow](./AUTH_FLOW.md)** - Authentication implementation
- **[Infrastructure](./INFRASTRUCTURE.md)** - Azure & Kubernetes setup
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Issue resolutions
- **[API Docs](./API_DOCS.md)** - API endpoint reference

---

## 📝 Task Answers Summary

This document provides concise answers to all Week 1 tasks. For detailed implementation guides, refer to the documentation hub above.

---

## Step 1: Azure Container Registry and API Deployment

**1.1-1.2: Create and Containerize API**
- ✅ Node.js/TypeScript Express API with health, auth, and protected endpoints
- ✅ Multi-stage Docker build (Node.js 18 Alpine, ~192 MB)
- Location: `e:\MindX\Week1\week1-api\`

**1.3-1.4: Azure Container Registry**
- ✅ ACR: `mindxweek1minhnhacr.azurecr.io` (Southeast Asia, Basic SKU)
- ✅ Images pushed: API v14, Frontend api-url-fix
- Commands: `az acr create`, `docker push`

**1.5-1.6: Deploy to Azure Web App**
- ✅ Web App: `mindx-week1-api.azurewebsites.net`
- ✅ Verified: Health and API endpoints accessible via HTTPS

**1.7: Repository Setup**
- ✅ GitHub: https://github.com/nminh2209/MindX_onboarding_repo
- ✅ Structure: week1-api/, week1-frontend/, k8s/, docs/

---

## Step 2: Deploy to Azure Kubernetes Service

**2.1-2.2: AKS Cluster Setup**
- ✅ Cluster: `mindx-week1-aks` (1 node, Standard DS2 v2)
- ✅ kubectl configured with `az aks get-credentials`

**2.3-2.4: Kubernetes Deployment**
- ✅ Manifests: deployment.yaml (2 replicas), service.yaml (ClusterIP)
- ✅ Deployed API v14 to AKS from ACR

**2.5-2.6: Service and Verification**
- ✅ ClusterIP service on port 3000
- ✅ Verified with port-forward and pod exec

**2.7: Repository Update**
- ✅ All k8s manifests committed

---

## Step 3: Ingress Controller Setup

**3.1: Install Ingress**
- ✅ NGINX Ingress Controller v1.10.1
- ✅ External IP: 135.171.192.18

**3.2-3.3: Ingress Resources**
- ✅ Frontend ingress: path `/` → frontend service
- ✅ API ingress: path `/api/*` → backend service (with rewrite)
- ✅ TLS configuration with cert-manager annotations

**3.4-3.5: Verify and Document**
- ✅ All endpoints accessible via HTTPS
- ✅ SSL redirect working, paths routing correctly

---

## Step 4: React Web App Deployment

**4.1: Create React App**
- ✅ React 18.2.0 + TypeScript with Router 6.28.0
- ✅ Components: Login, Register, Dashboard, AuthContext, ProtectedRoute
- ✅ Modern UI with gradient design

**4.2: Containerize Frontend**
- ✅ Multi-stage Docker build (Node.js + nginx, ~81 MB)
- ✅ Client-side routing support, gzip compression

**4.3-4.4: Deploy to AKS**
- ✅ 2 replicas, ClusterIP service on port 80
- ✅ Deployed from ACR with digest

**4.5-4.6: Full-Stack Routing**
- ✅ Single ingress for frontend and API
- ✅ Complete frontend-backend communication verified

---

## Step 5: OpenID Authentication

**5.1: Authentication Method**
- ✅ OpenID Connect with https://id-dev.mindx.edu.vn
- ✅ OAuth2 Authorization Code Flow

**5.2: Backend Implementation**
- ✅ Libraries: openid-client v6, jsonwebtoken, express-jwt
- ✅ Endpoints: /auth/login, /auth/callback, /auth/logout
- ✅ JWT creation and validation middleware

**5.3: Frontend Auth UI**
- ✅ Login/Register components with MindX branding
- ✅ AuthContext for global state management
- ✅ ProtectedRoute component for route guards

**5.4: Authentication Flow**
- ✅ Complete OAuth2 flow: login → MindX → callback → JWT → dashboard
- ✅ Token storage in localStorage
- ✅ Bearer token for API calls

**5.5: Deploy and Test**
- ✅ Deployed API v14 and Frontend api-url-fix
- ✅ End-to-end authentication working in production

---

## Step 6: HTTPS and SSL Certificate

**6.1: Domain Configuration**
- ✅ Domain: mindx-minhnh.135.171.192.18.nip.io (nip.io service)
- ✅ Automatic DNS resolution to 135.171.192.18

**6.2: Install cert-manager**
- ✅ cert-manager v1.13.2 with CRDs
- ✅ All pods running in cert-manager namespace

**6.3: Ingress TLS**
- ✅ TLS configuration in all ingress resources
- ✅ Auto HTTPS redirect enabled

**6.4: SSL Certificate**
- ✅ Let's Encrypt production certificate
- ✅ Valid: Nov 27, 2025 → Feb 25, 2026
- ✅ Auto-renewal configured (30 days before expiry)

**6.5-6.6: Verify and Document**
- ✅ All endpoints accessible via HTTPS
- ✅ Valid SSL certificate, green padlock in browsers
- ✅ Complete documentation in repository

---

## 🎯 Production Deployment Summary

**Status:** ✅ FULLY OPERATIONAL

**URLs:**
- Application: https://mindx-minhnh.135.171.192.18.nip.io
- API: https://mindx-minhnh.135.171.192.18.nip.io/api
- Login: https://mindx-minhnh.135.171.192.18.nip.io/login

**Images:**
- Frontend: sha256:94a6fc383a7ed5d9157e48666134cfa1fd3ddd85d925301838de59b2db763f20
- Backend: sha256:1a6c383171f441ac510f427ff9db460f21aa6e93ff94ef04b596a547ef16bf5d

**Infrastructure:**
- Azure Resources: ACR, AKS (1 node), Load Balancer
- Kubernetes: 2 deployments (4 pods), 2 services, 2 ingresses, 1 certificate
- SSL: Let's Encrypt (auto-renewing)

**Authentication:**
- Provider: MindX OpenID (id-dev.mindx.edu.vn)
- Flow: OAuth2 Authorization Code
- Token: JWT (HS256, 1-hour expiry)

---

## 🐛 Issues Resolved

1. **Kubernetes Image Caching** - Used digest-based deployment + imagePullPolicy: Always
2. **Browser Caching** - Hard refresh guidance, cache-control headers
3. **Ingress Path Conflicts** - Deleted conflicting /auth ingress
4. **Backend Auth Error** - Fixed openid-client v6 API usage
5. **Login Page Blank** - Fixed AuthContext URL construction (removed .replace('/api', ''))

---

## 📊 Statistics

- Commands Executed: 100+
- Files Created: 35+
- Docker Images: 15+ versions built
- Kubernetes Resources: 17 active
- Issues Resolved: 5 major
- Lines of Code: 3,000+
- Documentation Pages: 6 comprehensive guides

---

## 🎓 Skills Demonstrated

✅ Node.js/TypeScript & React/TypeScript development  
✅ Docker containerization & multi-stage builds  
✅ Azure services (ACR, AKS, Load Balancer)  
✅ Kubernetes orchestration & ingress  
✅ OpenID Connect / OAuth2 / JWT authentication  
✅ SSL/TLS with cert-manager & Let's Encrypt  
✅ Production deployment & troubleshooting  
✅ Technical documentation

---

**Last Updated:** November 28, 2025  
**Status:** Week 1 Complete - All Acceptance Criteria Met

For detailed information, see the [Documentation Hub](../README.md).  

---

**Document Created:** November 27, 2025  
**Last Updated:** November 28, 2025  
**Status:** Week 1 Complete - All Tasks Finished and Deployed to Production
