# Week 3: AI Application with Domain Knowledge & MCP Tools

## Overview

This week you built a production-ready AI agent application that integrates:
- **Vector Database (Qdrant)** for domain knowledge and RAG
- **MCP Tools** for external API integration and data retrieval
- **Conversation Memory** for context-aware multi-turn conversations
- **Production Monitoring** with comprehensive metrics tracking
- **Azure Kubernetes Service** deployment with auto-scaling

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                             │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Nginx Ingress Controller                        │
│    mindx-minhnh.135.171.192.18.nip.io                       │
└──────┬────────────────────────┬─────────────────────────────┘
       │                        │
       │ /                      │ /api/*
       ▼                        ▼
┌──────────────┐        ┌──────────────────┐
│   Frontend   │        │   Backend API    │
│  React SPA   │        │  Node.js/Express │
│              │        │                  │
│  - Chat UI   │        │  - AI Chat       │
│  - Knowledge │        │  - RAG           │
│    Ingest    │        │  - MCP Tools     │
└──────────────┘        │  - Memory        │
                        └────┬─────┬───────┘
                             │     │
              ┌──────────────┘     └──────────────┐
              │                                    │
              ▼                                    ▼
      ┌──────────────┐                    ┌──────────────┐
      │   Qdrant     │                    │  OpenRouter  │
      │Vector Database│                    │   AI API     │
      │              │                    │              │
      │  - Embeddings│                    │  - GPT-4o    │
      │  - RAG Search│                    │  - Embeddings│
      └──────────────┘                    └──────────────┘
              │
              ▼
      ┌──────────────┐
      │ Persistent   │
      │   Storage    │
      │   (5GB PVC)  │
      └──────────────┘
              │
              ▼
      ┌──────────────┐
      │ App Insights │
      │  Monitoring  │
      │              │
      │  - Metrics   │
      │  - Logs      │
      │  - Traces    │
      └──────────────┘
```

## Documentation Pages

1. **[Architecture](./architecture.md)** - Detailed system architecture and component design
2. **[Deployment](./deployment.md)** - Step-by-step deployment guide for AKS
3. **[Features](./features.md)** - Complete feature documentation with examples
4. **[API Reference](./api-reference.md)** - API endpoints and integration guide
5. **[Monitoring](./monitoring.md)** - Metrics, dashboards, and troubleshooting
6. **[User Guide](./user-guide.md)** - End-user documentation for the AI chat

## Quick Links

- **Application URL**: https://mindx-minhnh.135.171.192.18.nip.io
- **Backend API**: https://mindx-minhnh.135.171.192.18.nip.io/api
- **Health Check**: https://mindx-minhnh.135.171.192.18.nip.io/api/health
- **Container Registry**: mindxweek1minhnhacr.azurecr.io

## Technology Stack

### Frontend
- React 18.3.1
- TypeScript
- Vite
- TailwindCSS

### Backend
- Node.js 18
- Express
- TypeScript
- OpenRouter API (GPT-4o-mini)
- Azure App Insights

### Infrastructure
- Azure Kubernetes Service (AKS)
- Qdrant Vector Database 1.9.0
- Nginx Ingress Controller
- Azure Container Registry
- Persistent Volume Claims (5GB)

### AI & Tools
- **LLM**: OpenRouter GPT-4o-mini
- **Embeddings**: text-embedding-3-small (1536 dimensions)
- **Vector Search**: Qdrant with Cosine similarity
- **MCP Tools**: Weather API, User Database, Knowledge Search

## Acceptance Criteria (AC)

### ✅ Component A: Vector Database + RAG
- [x] Qdrant deployed to AKS with persistent storage
- [x] Knowledge ingestion endpoint functional
- [x] Document embedding generation working
- [x] RAG search integrated into chat
- [x] Top 3 relevant documents injected as context
- [x] UI component for document ingestion

### ✅ Component B: MCP Tools
- [x] MCP server structure created
- [x] 3 tools implemented (query_database, search_knowledge, call_api)
- [x] Tool calling integrated into chat endpoint
- [x] Intent detection working
- [x] Weather API integration (Hanoi coordinates)
- [x] Error handling for tool failures

### ✅ Component C: Conversation Memory
- [x] In-memory session storage implemented
- [x] Last 10 messages per user retained
- [x] Message history loaded for each request
- [x] Context maintained across conversations
- [x] Auto-cleanup of inactive sessions (24h)

### ✅ Step 3: Production Deployment
- [x] Health checks configured
- [x] Comprehensive metrics tracking
  - [x] AI response times and token usage
  - [x] RAG retrieval metrics
  - [x] Tool execution tracking
  - [x] User engagement metrics
  - [x] Error tracking with context
- [x] App Insights integration
- [x] Load testing completed (100% success rate)
- [x] Production-ready container images
- [x] Documentation complete

## Current Deployment

**Version**: v26-production

**Resources**:
- Backend: 2 replicas, 512Mi memory, 500m CPU
- Frontend: 2 replicas, 256Mi memory, 250m CPU
- Qdrant: 1 replica, 1Gi memory, 5GB storage

**Status**: ✅ Production Ready

## Key Features

1. **AI Chat with Streaming** - Real-time token-by-token responses
2. **RAG Knowledge Search** - Automatic context injection from vector database
3. **MCP Tool Calling** - External API integration (weather, database, knowledge)
4. **Conversation Memory** - Multi-turn context awareness
5. **Knowledge Management** - UI for document ingestion
6. **Production Monitoring** - Comprehensive metrics in App Insights

## Testing Results

### Load Test (10 concurrent requests)
- ✅ 100% success rate
- ✅ Avg response: 196ms
- ✅ P95 response: 234ms
- ✅ All performance checks passed

### Functional Testing
- ✅ Authentication working (MindX SSO)
- ✅ Chat streaming functional
- ✅ RAG integration validated
- ✅ Tool calling operational
- ✅ Memory persistence confirmed
- ✅ Knowledge ingestion working

## Next Steps

1. Review all documentation pages
2. Validate acceptance criteria
3. Perform final smoke test
4. Mark Week 3 as complete
5. Prepare for Week 4

## Support & Troubleshooting

See **[Monitoring Guide](./monitoring.md)** for:
- Common issues and solutions
- Log analysis
- Performance debugging
- Resource scaling

## Contributors

- Developer: MinhNH
- Program: MindX Engineer Onboarding
- Week: 3 - AI Application Development
