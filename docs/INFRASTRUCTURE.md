# Azure & Kubernetes Infrastructure Documentation

**Cloud Provider:** Microsoft Azure  
**Region:** Southeast Asia  
**Deployment Date:** November 27, 2025

---

## 🏗️ Architecture Overview

```
Internet
    ↓
Azure Load Balancer (135.171.192.18)
    ↓
NGINX Ingress Controller
    ↓
    ├─→ Frontend Service (ClusterIP:80)
    │       ↓
    │   Frontend Pods (2 replicas)
    │   - React App
    │   - nginx server
    │
    └─→ Backend Service (ClusterIP:3000)
            ↓
        Backend Pods (2 replicas)
        - Node.js API
        - OpenID integration
```

---

## ☁️ Azure Resources

### Resource Group
- **Name:** `mindx-minhnh-rg`
- **Location:** Southeast Asia
- **Purpose:** Container for all Week 1 resources

### Azure Container Registry (ACR)
- **Name:** `mindxweek1minhnhacr`
- **Login Server:** `mindxweek1minhnhacr.azurecr.io`
- **SKU:** Basic
- **Admin Access:** Enabled
- **Repositories:**
  - `week1-api` (backend images)
  - `week1-frontend` (frontend images)

**Creation Command:**
```bash
az acr create \
  --resource-group mindx-minhnh-rg \
  --name mindxweek1minhnhacr \
  --sku Basic \
  --location southeastasia
```

### Azure Kubernetes Service (AKS)
- **Name:** `mindx-week1-aks`
- **Kubernetes Version:** Latest stable
- **Node Count:** 1
- **Node Size:** Standard DS2 v2
- **Network Plugin:** kubenet
- **DNS Prefix:** mindx-week1-aks

**Creation Command:**
```bash
az aks create \
  --resource-group mindx-minhnh-rg \
  --name mindx-week1-aks \
  --node-count 1 \
  --generate-ssh-keys
```

**Credentials:**
```bash
az aks get-credentials \
  --resource-group mindx-minhnh-rg \
  --name mindx-week1-aks
```

### Azure Load Balancer
- **Type:** Standard
- **Frontend IP:** 135.171.192.18 (Static)
- **Purpose:** External access to ingress controller
- **Backend Pool:** AKS nodes

---

## ☸️ Kubernetes Resources

### Namespaces

#### default
- Frontend deployment and service
- Backend deployment and service
- Application ingresses

#### ingress-nginx
- NGINX ingress controller
- Ingress controller service (LoadBalancer)

#### cert-manager
- cert-manager controller
- cert-manager webhook
- cert-manager cainjector
- Certificate management components

---

### Deployments

#### Frontend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: week1-frontend-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: week1-frontend
  template:
    metadata:
      labels:
        app: week1-frontend
    spec:
      containers:
      - name: week1-frontend
        image: mindxweek1minhnhacr.azurecr.io/week1-frontend@sha256:94a6fc...
        imagePullPolicy: Always
        ports:
        - containerPort: 80
        resources:
          limits:
            memory: "128Mi"
            cpu: "100m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
      imagePullSecrets:
      - name: acr-secret
```

**Key Features:**
- 2 replicas for high availability
- Image pull from ACR with digest
- Health probes for reliability
- Resource limits for stability

#### Backend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: week1-api-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: week1-api
  template:
    metadata:
      labels:
        app: week1-api
    spec:
      containers:
      - name: week1-api
        image: mindxweek1minhnhacr.azurecr.io/week1-api@sha256:1a6c38...
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        env:
        - name: FRONTEND_URL
          value: "https://mindx-minhnh.135.171.192.18.nip.io"
        - name: REDIRECT_URI
          value: "https://mindx-minhnh.135.171.192.18.nip.io/api/auth/callback"
        resources:
          limits:
            memory: "256Mi"
            cpu: "200m"
      imagePullSecrets:
      - name: acr-secret
```

---

### Services

#### Frontend Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: week1-frontend-service
spec:
  type: ClusterIP
  selector:
    app: week1-frontend
  ports:
  - port: 80
    targetPort: 80
```

#### Backend Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: week1-api-service
spec:
  type: ClusterIP
  selector:
    app: week1-api
  ports:
  - port: 3000
    targetPort: 3000
```

---

### Ingress Resources

#### Frontend Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: week1-frontend-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - mindx-minhnh.135.171.192.18.nip.io
    secretName: mindx-tls-cert
  rules:
  - host: mindx-minhnh.135.171.192.18.nip.io
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: week1-frontend-service
            port:
              number: 80
```

#### API Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: week1-api-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - mindx-minhnh.135.171.192.18.nip.io
    secretName: mindx-tls-cert
  rules:
  - host: mindx-minhnh.135.171.192.18.nip.io
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: week1-api-service
            port:
              number: 3000
```

---

### Certificates

#### TLS Certificate
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: mindx-tls-cert
spec:
  secretName: mindx-tls-cert
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - mindx-minhnh.135.171.192.18.nip.io
```

**Status:**
- Issuer: Let's Encrypt Production
- Valid From: November 27, 2025
- Valid Until: February 25, 2026
- Auto-Renewal: Enabled (30 days before expiry)

#### Cluster Issuer
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: minhnh@mindx.com.vn
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

---

### Secrets

#### ACR Pull Secret
```bash
kubectl create secret docker-registry acr-secret \
  --docker-server=mindxweek1minhnhacr.azurecr.io \
  --docker-username=mindxweek1minhnhacr \
  --docker-password=<PASSWORD> \
  --docker-email=minhnh@mindx.com.vn
```

#### TLS Certificate Secret
- **Name:** `mindx-tls-cert`
- **Type:** kubernetes.io/tls
- **Managed By:** cert-manager
- **Contains:** TLS certificate and private key

---

## 🔧 NGINX Ingress Controller

### Installation
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
```

### Configuration
- **Version:** v1.10.1
- **Type:** LoadBalancer
- **External IP:** 135.171.192.18
- **HTTP Port:** 80
- **HTTPS Port:** 443

### Features
- Path-based routing
- SSL/TLS termination
- HTTP to HTTPS redirect
- URL rewriting for /api paths
- Health checks

---

## 📦 Container Images

### Frontend Image
- **Repository:** `mindxweek1minhnhacr.azurecr.io/week1-frontend`
- **Current Digest:** `sha256:94a6fc383a7ed5d9157e48666134cfa1fd3ddd85d925301838de59b2db763f20`
- **Base Image:** nginx:alpine
- **Build:** Multi-stage (Node.js builder + nginx)
- **Size:** ~81 MB

### Backend Image
- **Repository:** `mindxweek1minhnhacr.azurecr.io/week1-api`
- **Current Digest:** `sha256:1a6c383171f441ac510f427ff9db460f21aa6e93ff94ef04b596a547ef16bf5d`
- **Base Image:** node:18-alpine
- **Build:** Multi-stage (builder + production)
- **Size:** ~192 MB

---

## 🌐 Network Configuration

### DNS
- **Provider:** nip.io (automatic DNS)
- **Domain:** mindx-minhnh.135.171.192.18.nip.io
- **Resolution:** Automatic to 135.171.192.18
- **Propagation:** Instant

### Routing
- `/` → Frontend (React SPA)
- `/api/*` → Backend (Node.js API)
- `*` → HTTP → HTTPS redirect

### Load Balancing
- **Algorithm:** Round-robin
- **Health Checks:** Enabled
- **Session Affinity:** None (stateless)

---

## 📊 Resource Limits

### Frontend Pods
- **Memory Limit:** 128Mi
- **CPU Limit:** 100m
- **Memory Request:** 64Mi
- **CPU Request:** 50m

### Backend Pods
- **Memory Limit:** 256Mi
- **CPU Limit:** 200m
- **Memory Request:** 128Mi
- **CPU Request:** 100m

---

## 🔍 Monitoring Commands

### Check All Resources
```bash
kubectl get all
kubectl get deployments
kubectl get services
kubectl get ingress
kubectl get pods
kubectl get certificates
```

### Check Specific Resources
```bash
# Frontend
kubectl get pods -l app=week1-frontend
kubectl logs -l app=week1-frontend --tail=50

# Backend
kubectl get pods -l app=week1-api
kubectl logs -l app=week1-api --tail=50

# Ingress
kubectl get ingress
kubectl describe ingress week1-frontend-ingress

# Certificate
kubectl get certificate
kubectl describe certificate mindx-tls-cert
```

### Check Resource Usage
```bash
kubectl top nodes
kubectl top pods
```

---

## 🛠️ Management Commands

### Scale Deployments
```bash
# Scale frontend
kubectl scale deployment week1-frontend-deployment --replicas=3

# Scale backend
kubectl scale deployment week1-api-deployment --replicas=3
```

### Update Images
```bash
# Update with specific digest
kubectl set image deployment/week1-frontend-deployment \
  week1-frontend=mindxweek1minhnhacr.azurecr.io/week1-frontend@sha256:...

# Rollout status
kubectl rollout status deployment/week1-frontend-deployment
```

### Restart Pods
```bash
# Force restart frontend
kubectl delete pod -l app=week1-frontend

# Force restart backend
kubectl delete pod -l app=week1-api
```

---

## 📈 Cost Optimization

**Current Monthly Estimate:**
- AKS Cluster (1 node, DS2_v2): ~$70/month
- ACR Basic: ~$5/month
- Load Balancer: ~$20/month
- **Total:** ~$95/month

**Optimization Tips:**
- Use B-series VMs for dev/test
- Schedule cluster shutdown for non-working hours
- Clean up old container images
- Monitor and right-size resources

---

## 🔗 Related Documentation

- [Production Status](./PRODUCTION_STATUS.md) - Current deployment status
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common infrastructure issues
- [Implementation Guide](./IMPLEMENTATION.md) - Step-by-step setup

---

**Last Updated:** November 28, 2025  
**Infrastructure Status:** Stable and Operational
