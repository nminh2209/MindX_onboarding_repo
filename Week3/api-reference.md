# API Reference

## Base URL

```
Production: https://mindx-minhnh.135.171.192.18.nip.io/api
```

## Authentication

All API endpoints (except `/health`) require JWT authentication via MindX SSO.

### Authentication Flow

1. **Login** (via frontend)
   - Redirects to MindX SSO
   - User authenticates
   - Receives JWT token
   - Token stored in browser

2. **API Requests**
   ```http
   Authorization: Bearer <jwt-token>
   ```

### Token Format
```json
{
  "sub": "user-id",
  "email": "user@mindx.com",
  "name": "User Name",
  "iat": 1516239022,
  "exp": 1516242622
}
```

## Endpoints

### 1. Health Check

Check API availability and status.

**Endpoint**: `GET /health`

**Authentication**: Not required

**Request**:
```bash
curl https://mindx-minhnh.135.171.192.18.nip.io/api/health
```

**Response** `200 OK`:
```json
{
  "status": "healthy"
}
```

**Use Cases**:
- Load balancer health checks
- Monitoring and alerting
- Deployment validation

---

### 2. Chat

Send messages to the AI and receive streaming responses.

**Endpoint**: `POST /chat`

**Authentication**: Required

**Request Headers**:
```http
Content-Type: application/json
Authorization: Bearer <jwt-token>
```

**Request Body**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is the weather in Hanoi?"
    }
  ]
}
```

**Message Roles**:
- `user`: User's message
- `assistant`: AI's previous response
- `system`: System instructions (auto-added for RAG)

**Response** `200 OK` (Server-Sent Events):
```http
Content-Type: text/event-stream
Transfer-Encoding: chunked

data: {"type":"token","content":"The"}
data: {"type":"token","content":" weather"}
data: {"type":"token","content":" in"}
data: {"type":"token","content":" Hanoi"}
data: {"type":"token","content":" is"}
data: {"type":"token","content":" 28"}
data: {"type":"token","content":"°C"}
data: {"type":"done"}
```

**Event Types**:
- `token`: Partial response content
- `done`: Stream complete

**Error Response** `401 Unauthorized`:
```json
{
  "error": "Authentication required"
}
```

**Error Response** `500 Internal Server Error`:
```json
{
  "error": "Chat failed",
  "message": "OpenRouter API error: Rate limit exceeded"
}
```

**Examples**:

**Simple Chat**:
```bash
curl -X POST https://mindx-minhnh.135.171.192.18.nip.io/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

**Multi-turn Conversation**:
```bash
curl -X POST https://mindx-minhnh.135.171.192.18.nip.io/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is RAG?"},
      {"role": "assistant", "content": "RAG stands for..."},
      {"role": "user", "content": "How does it work?"}
    ]
  }'
```

**Trigger RAG Search**:
```bash
curl -X POST https://mindx-minhnh.135.171.192.18.nip.io/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "messages": [
      {"role": "user", "content": "Search the knowledge base for deployment"}
    ]
  }'
```

**Trigger Tool Calling**:
```bash
curl -X POST https://mindx-minhnh.135.171.192.18.nip.io/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is the weather in Hanoi?"}
    ]
  }'
```

**Features**:
- ✅ Streaming responses (SSE)
- ✅ Conversation memory (last 10 messages)
- ✅ RAG knowledge search (auto-triggered)
- ✅ MCP tool calling (auto-triggered)
- ✅ Metrics tracking

---

### 3. Knowledge Ingestion

Upload documents to the vector database for RAG.

**Endpoint**: `POST /ingest`

**Authentication**: Required

**Request Headers**:
```http
Content-Type: application/json
Authorization: Bearer <jwt-token>
```

**Request Body**:
```json
{
  "documents": [
    {
      "text": "Azure Kubernetes Service (AKS) is a managed container orchestration service.",
      "metadata": {
        "source": "azure-docs",
        "category": "infrastructure",
        "tags": ["azure", "kubernetes", "aks"]
      }
    },
    {
      "text": "Docker is a platform for developing, shipping, and running applications.",
      "metadata": {
        "source": "docker-docs",
        "category": "containers"
      }
    }
  ]
}
```

**Document Fields**:
- `text` (required): Document content (string)
- `metadata` (optional): Key-value pairs (object)
  - `source`: Document source
  - `category`: Document category
  - `tags`: Array of tags
  - Custom fields allowed

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Successfully ingested 2 documents",
  "count": 2
}
```

**Error Response** `400 Bad Request`:
```json
{
  "error": "Invalid request",
  "message": "Documents array is required and must not be empty"
}
```

**Error Response** `500 Internal Server Error`:
```json
{
  "error": "Ingestion failed",
  "message": "Failed to generate embeddings: API key invalid"
}
```

**Examples**:

**Single Document**:
```bash
curl -X POST https://mindx-minhnh.135.171.192.18.nip.io/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "documents": [
      {
        "text": "Qdrant is a vector database for AI applications.",
        "metadata": {"source": "qdrant-docs"}
      }
    ]
  }'
```

**Batch Upload**:
```bash
curl -X POST https://mindx-minhnh.135.171.192.18.nip.io/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "documents": [
      {"text": "Document 1 content...", "metadata": {"source": "doc1"}},
      {"text": "Document 2 content...", "metadata": {"source": "doc2"}},
      {"text": "Document 3 content...", "metadata": {"source": "doc3"}}
    ]
  }'
```

**Features**:
- ✅ Batch ingestion supported
- ✅ Automatic embedding generation
- ✅ Metadata storage
- ✅ Immediate searchability
- ✅ Metrics tracking

---

## MCP Tools (Internal)

These tools are called internally by the chat endpoint and not directly accessible.

### Tool: query_database

**Purpose**: Retrieve user profile information

**Input**:
```json
{
  "query": "user profile"
}
```

**Output**:
```json
{
  "sub": "test-user",
  "email": "test@mindx.com",
  "name": "Test User",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Trigger Keywords**: profile, account, user info

---

### Tool: search_knowledge

**Purpose**: Search knowledge base (mock implementation)

**Input**:
```json
{
  "query": "Week 3"
}
```

**Output**:
```json
[
  "Week 3 focuses on AI application development",
  "Key topics include RAG, MCP, and Vector Databases",
  "Deliverable is a production-ready AI agent"
]
```

**Trigger Keywords**: search, find, lookup, knowledge

---

### Tool: call_api

**Purpose**: Make HTTP requests to external APIs

**Input**:
```json
{
  "url": "https://api.open-meteo.com/v1/forecast",
  "method": "GET",
  "params": {
    "latitude": 21.0285,
    "longitude": 105.8542,
    "current_weather": true
  }
}
```

**Output**:
```json
{
  "latitude": 21.0285,
  "longitude": 105.8542,
  "current_weather": {
    "temperature": 28.5,
    "windspeed": 5.2,
    "weathercode": 2
  }
}
```

**Trigger Keywords**: weather, temperature, forecast, API

---

## Rate Limits

### OpenRouter API
- **Requests**: Limited by OpenRouter tier
- **Tokens**: ~100k tokens/month (free tier)
- **Embeddings**: Same as LLM limits

### Application Limits
- **No hard limits** currently implemented
- **Recommended**: < 100 requests/minute per user
- **Future**: Rate limiting via API Gateway

---

## Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid JSON, missing required fields |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Token expired or insufficient permissions |
| 500 | Internal Server Error | AI API failure, database error |
| 503 | Service Unavailable | Qdrant or OpenRouter unavailable |

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Chat with streaming
const response = await fetch('https://mindx-minhnh.135.171.192.18.nip.io/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello!' }
    ]
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.type === 'token') {
        console.log(data.content);
      }
    }
  }
}
```

### Python

```python
import requests
import json

# Chat
response = requests.post(
    'https://mindx-minhnh.135.171.192.18.nip.io/api/chat',
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    },
    json={
        'messages': [
            {'role': 'user', 'content': 'Hello!'}
        ]
    },
    stream=True
)

for line in response.iter_lines():
    if line.startswith(b'data: '):
        data = json.loads(line[6:])
        if data['type'] == 'token':
            print(data['content'], end='', flush=True)
```

### cURL

```bash
# Chat (non-streaming)
curl -X POST https://mindx-minhnh.135.171.192.18.nip.io/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"messages":[{"role":"user","content":"Hello!"}]}'

# Knowledge ingestion
curl -X POST https://mindx-minhnh.135.171.192.18.nip.io/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"documents":[{"text":"Test document","metadata":{"source":"test"}}]}'
```

---

## WebSocket (Future)

**Note**: Currently using Server-Sent Events (SSE). WebSocket support planned for future versions.

```typescript
// Future WebSocket API
const ws = new WebSocket('wss://mindx-minhnh.135.171.192.18.nip.io/ws/chat');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.content);
};

ws.send(JSON.stringify({
  type: 'message',
  content: 'Hello!'
}));
```

---

## Monitoring & Metrics

### App Insights Integration

All API requests are tracked in Azure Application Insights:

**Custom Metrics**:
- `ai_response_time`: AI API latency
- `ai_token_usage_total`: Token consumption
- `rag_documents_retrieved`: RAG effectiveness
- `tool_execution_duration`: Tool performance

**Custom Events**:
- `feature_usage`: Feature adoption tracking
- `chat_session`: Session analytics
- `rag_usage`: RAG search activity
- `tool_execution`: Tool call tracking
- `knowledge_ingestion`: Document uploads

**Query Example**:
```kql
customMetrics
| where name == "ai_response_time"
| where timestamp > ago(1h)
| summarize avg(value), percentiles(value, 95, 99)
```

---

## Acceptance Criteria

### ✅ API Completeness
- [x] All endpoints documented
- [x] Request/response formats specified
- [x] Error codes documented
- [x] Authentication explained
- [x] Examples provided

### ✅ API Functionality
- [x] Health check working
- [x] Chat endpoint functional
- [x] Ingestion endpoint working
- [x] Streaming responses operational
- [x] Error handling comprehensive

### ✅ Integration
- [x] SDK examples provided
- [x] Tool integration documented
- [x] Metrics tracking explained
- [x] Rate limits specified

