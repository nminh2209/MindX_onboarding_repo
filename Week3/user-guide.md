# User Guide

## Getting Started

Welcome to the MindX AI Application! This guide will help you get started with the intelligent chat interface powered by AI with knowledge base search and tool integration.

## Accessing the Application

**URL**: https://mindx-minhnh.135.171.192.18.nip.io

### Login

1. Open the application URL in your web browser
2. Click **"Login with MindX"**
3. Enter your MindX credentials
4. You'll be redirected back to the chat interface

**Note**: You must have a valid MindX account to use the application.

## Chat Interface

### Basic Chat

1. Type your message in the text box at the bottom
2. Press **Enter** or click **Send**
3. Watch as the AI responds in real-time (token by token)
4. Continue the conversation naturally

**Example**:
```
You: Hello! How can you help me?
AI: Hello! I'm an AI assistant that can help you with...
```

### Multi-turn Conversations

The AI remembers your last 10 messages in the conversation.

**Example**:
```
You: What is RAG?
AI: RAG stands for Retrieval-Augmented Generation...

You: How does it work?
AI: [Remembers we're talking about RAG]
    RAG works by first searching a knowledge base...

You: Give me an example
AI: [Still remembers the context]
    Building on what we discussed, here's an example...
```

## Using the Knowledge Base

### Searching for Information

To search the knowledge base, use trigger words like:
- "Search for..."
- "Find information about..."
- "Look up..."
- "What does the knowledge base say about..."

**Example**:
```
You: Search the knowledge base for deployment steps
AI: [Automatically searches vector database]
    Based on the knowledge base, here are the deployment steps:
    1. Build Docker images
    2. Push to Azure Container Registry
    ...
```

### How It Works

When you use search keywords:
1. Your query is converted to a vector (embedding)
2. The system searches the Qdrant database
3. Top 3 most relevant documents are found
4. Documents are provided to the AI as context
5. AI responds with knowledge-enhanced answers

## Adding Documents to Knowledge Base

### Step-by-Step

1. Click the **"Knowledge Base"** tab in the interface
2. Enter your document text in the large text area
3. (Optional) Add metadata tags:
   ```
   Source: documentation
   Category: deployment
   Tags: kubernetes, docker
   ```
4. Click **"Ingest Document"**
5. Wait for confirmation: ✅ Successfully ingested!
6. Your document is now searchable

### What to Upload

**Good documents**:
- Technical documentation
- How-to guides
- FAQs
- Process descriptions
- Code examples with explanations

**Tips**:
- Keep documents focused on one topic
- Include relevant keywords
- Add descriptive metadata
- Upload in batches for efficiency

**Example Document**:
```
Title: Deploying to Azure Kubernetes Service

Content:
To deploy to AKS, follow these steps:
1. Build your Docker image
2. Tag the image with ACR name
3. Push to Azure Container Registry
4. Apply Kubernetes manifests
5. Verify pods are running

Metadata:
- Source: deployment-guide
- Category: infrastructure
- Tags: azure, kubernetes, deployment
```

## Using AI Tools

The AI can automatically call tools to get real-time information.

### Weather Information

Ask about weather and the AI will fetch live data:

**Example**:
```
You: What's the weather in Hanoi?
AI: [Calls weather API]
    The current weather in Hanoi is 28°C with partly 
    cloudy skies and 75% humidity.
```

**Trigger words**: weather, temperature, forecast, climate

### User Profile

Ask about your profile information:

**Example**:
```
You: Show me my profile
AI: [Queries database]
    Your profile:
    - Name: Test User
    - Email: test@mindx.com
    - Account created: January 15, 2024
```

**Trigger words**: profile, account, my information

### Knowledge Search Tool

Alternative way to search knowledge:

**Example**:
```
You: Use the knowledge search tool to find Week 3 information
AI: [Calls search tool]
    Week 3 focuses on AI application development,
    covering RAG, MCP tools, and vector databases...
```

## Best Practices

### For Chat

✅ **Do**:
- Be specific in your questions
- Provide context when needed
- Use natural language
- Ask follow-up questions

❌ **Don't**:
- Send very long messages (>2000 characters)
- Spam requests rapidly
- Share sensitive information
- Expect the AI to remember everything forever (only last 10 messages)

### For Knowledge Base

✅ **Do**:
- Upload well-formatted documents
- Include relevant metadata
- Test search after upload
- Update outdated information

❌ **Don't**:
- Upload duplicate content
- Use very short snippets (<50 characters)
- Include personal/sensitive data
- Upload non-text content (images, PDFs)

## Troubleshooting

### "Authentication Required" Error

**Problem**: Not logged in or session expired

**Solution**:
1. Click "Login with MindX"
2. Re-authenticate
3. Try your request again

### Chat Not Responding

**Problem**: Network issue or AI API timeout

**Solution**:
1. Check your internet connection
2. Refresh the page
3. Try again in a few seconds
4. If persists, contact support

### Knowledge Search Not Finding Documents

**Problem**: Document not in database or poor relevance

**Solutions**:
1. Verify document was uploaded successfully
2. Try different search keywords
3. Check if document contains relevant terms
4. Re-upload with better metadata

### Slow Response Times

**Problem**: High load or complex query

**Solutions**:
1. Simplify your query
2. Avoid very long conversations (>10 turns)
3. Wait a few seconds before retrying
4. Try during off-peak hours

## Advanced Features

### Combining Features

You can trigger multiple features in one request:

**Example**:
```
You: Search the knowledge base for weather API documentation 
     and then check the current weather in Hanoi

AI: [Triggers both RAG search AND tool call]
    Based on the knowledge base, the weather API uses...
    [Calls weather tool]
    The current weather in Hanoi is 28°C...
```

### Conversation Export

(Future feature - planned)
- Export conversation history
- Save as PDF or JSON
- Share with team members

### Custom Tools

(Future feature - planned)
- Request custom tools for your use case
- Integration with your systems
- Personalized workflows

## Privacy & Security

### What We Track
- Your messages (for conversation memory)
- Usage metrics (anonymous)
- Error logs (for debugging)

### What We Don't Track
- Messages are not permanently stored
- No personal data beyond profile
- Conversations deleted after 24h inactivity

### Data Security
- All connections use HTTPS
- Authentication via MindX SSO
- No API keys in browser
- Conversation memory cleared regularly

## Support

### Need Help?

**Documentation**:
- [Architecture Guide](./architecture.md)
- [API Reference](./api-reference.md)
- [Features Documentation](./features.md)

**Contact**:
- Email: support@mindx.edu.vn
- Slack: #mindx-ai-support

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line in message |
| `Ctrl/Cmd + K` | Clear conversation |
| `Ctrl/Cmd + /` | Focus input box |

## Tips for Best Results

### 1. Be Specific

**Instead of**: "Tell me about deployment"
**Try**: "Search the knowledge base for step-by-step Azure deployment instructions"

### 2. Provide Context

**Instead of**: "What about the other one?"
**Try**: "What about the search_knowledge tool we discussed earlier?"

### 3. Use Keywords

For RAG: "search", "find", "lookup", "knowledge base"
For Weather: "weather", "temperature", "forecast"
For Profile: "profile", "account", "my information"

### 4. Break Down Complex Questions

**Instead of**: "Tell me everything about RAG, MCP tools, and how to deploy the system with monitoring"
**Try**: Ask in separate messages:
1. "Search the knowledge base for RAG information"
2. "Explain MCP tools"
3. "Show me deployment steps"
4. "How do I monitor the system?"

## Example Workflows

### Workflow 1: Learning About a Topic

```
1. You: "Search the knowledge base for vector databases"
2. AI: [Provides knowledge base results]
3. You: "Explain how Qdrant works"
4. AI: [Detailed explanation with context]
5. You: "Show me an example"
6. AI: [Example with full conversation context]
```

### Workflow 2: Adding and Using Knowledge

```
1. Navigate to "Knowledge Base" tab
2. Upload document: "Qdrant is a vector database..."
3. Switch back to "Chat" tab
4. You: "Search for Qdrant information"
5. AI: [Finds your just-uploaded document]
```

### Workflow 3: Getting Real-Time Data

```
1. You: "What's the weather in Hanoi?"
2. AI: [Calls weather API, returns live data]
3. You: "Is it good for outdoor activities?"
4. AI: [Uses previous weather context to answer]
```

## FAQ

**Q: How long are my conversations stored?**
A: Conversations are kept for 24 hours of inactivity, then automatically deleted.

**Q: Can I see my uploaded documents?**
A: Currently no UI for viewing, but documents are searchable immediately after upload.

**Q: Why doesn't the AI remember older messages?**
A: For performance, only the last 10 messages are kept in context.

**Q: Can I delete my conversation history?**
A: Yes, refresh the page or wait 24 hours. Future versions will have a "Clear" button.

**Q: Is my data private?**
A: Yes, conversations are per-user and not shared. Memory is cleared after 24h.

**Q: Can I use this on mobile?**
A: Yes! The interface is responsive and works on mobile browsers.

**Q: What AI model powers this?**
A: GPT-4o-mini via OpenRouter API.

**Q: Can I integrate this with my own app?**
A: See the [API Reference](./api-reference.md) for integration docs.

## Acceptance Criteria

### ✅ User Guide Completeness
- [x] Getting started instructions
- [x] Feature explanations with examples
- [x] Troubleshooting section
- [x] Best practices included
- [x] FAQ section provided
- [x] Privacy and security explained
- [x] Support contact information
- [x] Workflow examples included

### ✅ User Experience
- [x] Clear step-by-step instructions
- [x] Screenshots/examples for clarity
- [x] Common issues addressed
- [x] Tips for optimal usage
- [x] Keyboard shortcuts documented
