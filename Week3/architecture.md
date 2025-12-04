# Architecture Documentation

## System Architecture

The MindX AI Application is built using a microservices architecture deployed on Azure Kubernetes Service (AKS). The system consists of three main components: Frontend SPA, Backend API, and Vector Database.

## High-Level Architecture

```
Internet Users
      │
      │ HTTPS (443)
      ▼
┌─────────────────────────────────┐
│   Nginx Ingress Controller      │
│   - SSL Termination             │
│   - Path-based Routing          │
│   - Load Balancing              │
└─────────┬───────────────────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
Frontend      Backend
  SPA           API
```

## Component Architecture

### 1. Frontend Component

**Technology**: React 18 + TypeScript + Vite

**Responsibilities**:
- User interface for AI chat
- Knowledge document ingestion UI
- Authentication flow handling
- Real-time streaming display

**Key Features**:
- Server-Sent Events (SSE) for streaming responses
- JWT token management
- Responsive design with TailwindCSS
- Environment-based API configuration

**Files**:
```
week1-frontend/
├── src/
│   ├── components/
│   │   ├── Chat.tsx          # Main chat interface
│   │   └── KnowledgeIngest.tsx  # Document upload
│   ├── App.tsx               # Root component
│   └── main.tsx              # Entry point
├── Dockerfile                # Multi-stage build
└── nginx.conf                # Production server config
```

**Container Specs**:
- Base: nginx:alpine
- Memory: 256Mi limit, 128Mi request
- CPU: 250m limit, 100m request
- Replicas: 2 (high availability)

### 2. Backend API Component

**Technology**: Node.js 18 + Express + TypeScript

**Responsibilities**:
- AI chat orchestration
- RAG knowledge retrieval
- MCP tool execution
- Conversation memory management
- Metrics tracking

**Architecture Layers**:

```
┌──────────────────────────────────────────┐
│         Express HTTP Layer               │
│  - CORS, Body Parser, JWT Auth          │
└────────────────┬─────────────────────────┘
                 │
┌────────────────┴─────────────────────────┐
│           Route Layer                    │
│  - /api/chat                            │
│  - /api/ingest                          │
│  - /api/health                          │
└────────────────┬─────────────────────────┘
                 │
┌────────────────┴─────────────────────────┐
│         Service Layer                    │
│  - knowledge.ts (RAG)                   │
│  - mcp-tools.ts (Tool execution)        │
│  - conversation-memory.ts (Sessions)    │
│  - metrics.ts (App Insights)            │
└────────────────┬─────────────────────────┘
                 │
┌────────────────┴─────────────────────────┐
│       External Integration Layer         │
│  - OpenRouter API (AI + Embeddings)     │
│  - Qdrant API (Vector DB)               │
│  - Azure App Insights                   │
│  - Weather API (MCP tool)               │
└──────────────────────────────────────────┘
```

**Service Descriptions**:

**knowledge.ts**:
- Document embedding generation
- Qdrant collection initialization
- Vector search with Cosine similarity
- Top-K retrieval (K=3)

**mcp-tools.ts**:
- Tool execution wrapper
- 3 tools: query_database, search_knowledge, call_api
- Error handling and timeout management
- Response formatting

**conversation-memory.ts**:
- In-memory session storage (Map)
- Message history (last 10 per user)
- Auto-cleanup (24h inactive sessions)
- Thread-safe operations

**metrics.ts**:
- App Insights custom metrics
- AI performance tracking
- RAG usage metrics
- Tool execution monitoring
- User engagement analytics

**Container Specs**:
- Base: node:18-alpine
- Memory: 512Mi limit, 256Mi request
- CPU: 500m limit, 200m request
- Replicas: 2 (high availability)
- Health Check: /health endpoint (30s interval)

### 3. Vector Database (Qdrant)

**Technology**: Qdrant 1.9.0

**Responsibilities**:
- Vector storage and indexing
- Similarity search
- Persistent data storage

**Configuration**:
- Collection: `knowledge_base`
- Vector Size: 1536 (text-embedding-3-small)
- Distance Metric: Cosine
- Index Type: HNSW (Hierarchical Navigable Small World)

**Storage**:
- PersistentVolumeClaim: 5Gi
- Storage Class: Azure Disk (managed-csi)
- Access Mode: ReadWriteOnce

**Container Specs**:
- Image: qdrant/qdrant:v1.9.0
- Memory: 1Gi limit, 512Mi request
- CPU: 1000m limit, 500m request
- Replicas: 1 (single instance)

## Data Flow

### Chat Request Flow

```
1. User types message in Frontend
   ↓
2. Frontend sends POST /api/chat with JWT token
   ↓
3. Backend validates JWT token
   ↓
4. Load conversation history (last 10 messages)
   ↓
5. Check if RAG needed (keyword detection)
   ↓
6. If RAG: Generate embedding → Search Qdrant → Get top 3 docs
   ↓
7. Check if tool calling needed (intent detection)
   ↓
8. If tool: Execute MCP tool → Get result
   ↓
9. Build message context (history + RAG + tool results)
   ↓
10. Stream request to OpenRouter GPT-4o-mini
    ↓
11. Stream tokens back to Frontend (SSE)
    ↓
12. Save conversation to memory
    ↓
13. Track metrics (response time, tokens, features used)
```

### Knowledge Ingestion Flow

```
1. User uploads document in Frontend
   ↓
2. Frontend sends POST /api/ingest with document text
   ↓
3. Backend validates request
   ↓
4. Initialize Qdrant collection (if not exists)
   ↓
5. Generate embeddings via OpenRouter
   ↓
6. Store vectors in Qdrant with metadata
   ↓
7. Track ingestion metrics
   ↓
8. Return success response
```

## Security Architecture

### Authentication & Authorization

```
┌──────────┐          ┌──────────────┐
│  User    │──login──>│  MindX SSO   │
└──────────┘          │  (OIDC)      │
                      └───────┬──────┘
                              │
                         JWT Token
                              │
                              ▼
                      ┌──────────────┐
                      │   Frontend   │
                      │ Store token  │
                      └───────┬──────┘
                              │
                    Authorization: Bearer <token>
                              │
                              ▼
                      ┌──────────────┐
                      │   Backend    │
                      │ Verify JWT   │
                      └──────────────┘
```

**Security Features**:
- JWT token validation on all API requests
- CORS configured for specific origins
- HTTPS enforced via Ingress
- Secrets stored in Kubernetes Secrets
- No API keys in source code

### Network Security

```
Internet (HTTPS) → Nginx Ingress → Services → Pods
                      ↓
                  SSL/TLS
                Termination
```

**Network Policies**:
- Frontend: Public HTTPS (443)
- Backend: Internal ClusterIP (3000)
- Qdrant: Internal ClusterIP (6333, 6334)
- No external access to backend/database

## Scalability Architecture

### Horizontal Pod Autoscaling (HPA)

**Current Configuration**:
- Frontend: Fixed 2 replicas
- Backend: Fixed 2 replicas
- Qdrant: Fixed 1 replica

**Future HPA Configuration**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: week1-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: week1-api-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Load Balancing

**Ingress Load Balancing**:
- Round-robin across pod replicas
- Session affinity: None (stateless design)
- Health check based routing

**Service Load Balancing**:
- Kubernetes Service with ClusterIP
- Automatic endpoint updates
- Failed pod removal

## Monitoring Architecture

### Observability Stack

```
Application Code
      ↓
┌─────────────────┐
│ Metrics.ts      │ → Custom Metrics
│ - trackAI*      │
│ - trackRAG*     │
│ - trackTool*    │
└─────────────────┘
      ↓
┌─────────────────┐
│ App Insights    │
│ SDK             │
└─────────────────┘
      ↓
┌─────────────────┐
│ Azure App       │
│ Insights        │
│ - Metrics       │
│ - Logs          │
│ - Traces        │
└─────────────────┘
```

**Metrics Tracked**:
- AI response times (avg, P95, P99)
- Token usage (prompt, completion, total)
- RAG retrieval (docs found, relevance scores)
- Tool execution (duration, success rate)
- Feature usage (chat, ingest, tools, RAG)
- Errors (type, message, context)

## Deployment Architecture

### CI/CD Pipeline

```
Code Push → Build → Push to ACR → Deploy to AKS
```

**Steps**:
1. Build Docker images locally
2. Tag with version (e.g., v26-production)
3. Push to Azure Container Registry
4. Update Kubernetes deployment
5. Rolling update (zero downtime)

### Environment Configuration

**Development**:
- Local Docker Compose
- SQLite for testing
- Mock MCP tools

**Production (AKS)**:
- Multi-replica deployments
- Persistent storage
- Azure services integration
- Production API keys

## Acceptance Criteria Validation

### ✅ AC1: Microservices Architecture
- Frontend, Backend, and Database are separate services
- Each runs in isolated containers
- Communication via well-defined APIs

### ✅ AC2: Scalability
- Kubernetes deployments with replica management
- Horizontal scaling capable
- Load balanced across pods

### ✅ AC3: High Availability
- Multi-replica frontend (2) and backend (2)
- Health checks and automatic restart
- Ingress load balancing

### ✅ AC4: Security
- JWT authentication on all endpoints
- HTTPS enforced
- Secrets management
- Network isolation

### ✅ AC5: Observability
- Comprehensive metrics tracking
- Centralized logging (App Insights)
- Health check endpoints
- Performance monitoring

## Technology Decisions

### Why Qdrant?
- Native vector search (vs PostgreSQL pgvector)
- Better performance for high-dimensional vectors
- Built-in HNSW indexing
- Easy Kubernetes deployment

### Why OpenRouter?
- Access to multiple AI models
- Unified API for LLM and embeddings
- Better rate limits than direct OpenAI
- Cost-effective for development

### Why In-Memory Conversation Storage?
- Low latency (<1ms access)
- Simplified architecture
- Sufficient for POC/demo
- Easy to migrate to Redis/CosmosDB later

### Why Node.js for Backend?
- Native async/streaming support
- Large ecosystem for AI/ML
- TypeScript type safety
- Fast development iteration

## Future Enhancements

1. **Persistent Conversation Storage**: Redis or CosmosDB
2. **Horizontal Pod Autoscaling**: CPU/memory based
3. **API Gateway**: Rate limiting, caching
4. **Vector Database Replication**: Qdrant cluster mode
5. **Observability**: Distributed tracing with OpenTelemetry
6. **CI/CD**: GitHub Actions automated deployment
