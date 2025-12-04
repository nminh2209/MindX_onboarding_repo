import type { Request, Response } from 'express';
import * as appInsights from 'applicationinsights';
import { searchKnowledge } from '../services/knowledge.js';
import { executeTool } from '../services/mcp-tools.js';
import { getHistory, addMessage } from '../services/conversation-memory.js';
import { 
  trackAIResponseTime, 
  trackAITokenUsage, 
  trackRAGUsage, 
  trackToolExecution,
  trackFeatureUsage,
  trackAIError 
} from '../services/metrics.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.warn('⚠️ OPENROUTER_API_KEY not set - AI chat will not work');
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * AI Chat endpoint with streaming support
 * POST /api/chat
 * Body: { messages: ChatMessage[], model?: string, stream?: boolean }
 */
export async function handleChat(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    const { messages, model = 'openai/gpt-3.5-turbo', stream = true }: ChatRequest = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    // Get user ID from JWT token
    const userId = (req as any).user?.sub || 'anonymous';
    
    // Load conversation history
    const history = getHistory(userId, 10); // Last 10 messages
    
    // Combine history with new messages (avoid duplicates)
    const lastHistoryMessage = history[history.length - 1];
    const firstNewMessage = messages[0];
    const isDuplicate = lastHistoryMessage && 
      lastHistoryMessage.role === firstNewMessage.role && 
      lastHistoryMessage.content === firstNewMessage.content;
    
    let allMessages = isDuplicate ? [...history, ...messages.slice(1)] : [...history, ...messages];
    
    console.log(`💬 User ${userId}: ${history.length} history + ${messages.length} new = ${allMessages.length} total`);

    // Get the last user message for RAG search and tool detection
    const lastUserMessage = allMessages.filter(m => m.role === 'user').pop();
    let contextMessages = [...allMessages];
    
    // Detect and execute tools first
    if (lastUserMessage) {
      const userQuery = lastUserMessage.content.toLowerCase();
      let toolResult = null;
      
      // Check for database query intent
      if (userQuery.includes('my profile') || userQuery.includes('my email') || userQuery.includes('my user')) {
        console.log('🔧 Executing tool: query_database');
        const toolStart = Date.now();
        try {
          toolResult = await executeTool('query_database', { query: lastUserMessage.content });
          trackToolExecution('query_database', Date.now() - toolStart, true);
          trackFeatureUsage('tool_call', userId);
        } catch (error: any) {
          trackToolExecution('query_database', Date.now() - toolStart, false, error.message);
        }
      }
      // Check for knowledge search intent (different from RAG - explicit search)
      else if (userQuery.includes('search knowledge') || userQuery.includes('find in knowledge')) {
        console.log('🔧 Executing tool: search_knowledge');
        const toolStart = Date.now();
        const searchQuery = lastUserMessage.content.replace(/search knowledge (for|about)?/i, '').trim();
        try {
          toolResult = await executeTool('search_knowledge', { query: searchQuery });
          trackToolExecution('search_knowledge', Date.now() - toolStart, true);
          trackFeatureUsage('tool_call', userId);
        } catch (error: any) {
          trackToolExecution('search_knowledge', Date.now() - toolStart, false, error.message);
        }
      }
      // Check for API call intent
      else if (userQuery.includes('weather') || userQuery.includes('news')) {
        console.log('🔧 Executing tool: call_api');
        const toolStart = Date.now();
        // Example: call a weather API
        if (userQuery.includes('weather')) {
          try {
            // Hanoi, Vietnam coordinates: 21.0285, 105.8542
            toolResult = await executeTool('call_api', {
              url: 'https://api.open-meteo.com/v1/forecast?latitude=21.0285&longitude=105.8542&current_weather=true&timezone=Asia/Ho_Chi_Minh',
              method: 'GET'
            });
            trackToolExecution('call_api', Date.now() - toolStart, true);
            trackFeatureUsage('tool_call', userId);
          } catch (error: any) {
            trackToolExecution('call_api', Date.now() - toolStart, false, error.message);
          }
        }
      }
      
      // If a tool was executed, add its result to context
      if (toolResult) {
        const toolContext: ChatMessage = {
          role: 'system',
          content: `Tool executed successfully. Result:\n${JSON.stringify(toolResult, null, 2)}\n\nUse this information to answer the user's question.`
        };
        contextMessages = [toolContext, ...messages];
        console.log('✅ Tool result added to context');
      }
    }

    // Perform RAG search if there's a user query (and no tool was executed)
    if (lastUserMessage && contextMessages.length === allMessages.length) {
      try {
        const knowledgeResults = await searchKnowledge(lastUserMessage.content, 3);
        
        if (knowledgeResults.length > 0) {
          // Add context from knowledge base as a system message
          const contextText = knowledgeResults
            .map((r, i) => `[Knowledge ${i + 1}] (relevance: ${r.score.toFixed(2)})\n${r.text}`)
            .join('\n\n');
          
          const systemContext: ChatMessage = {
            role: 'system',
            content: `You are a helpful AI assistant with access to a knowledge base. Use the following relevant information to help answer the user's question. If the information is not relevant, you can provide a general response.\n\n${contextText}`
          };
          
          // Insert context before the last user message
          contextMessages = [systemContext, ...allMessages];
          
          console.log(`📚 RAG: Found ${knowledgeResults.length} relevant documents`);
          trackRAGUsage(knowledgeResults.length, knowledgeResults[0].score, true);
          trackFeatureUsage('rag_search', userId);
        }
      } catch (ragError) {
        console.error('⚠️ RAG search failed, continuing without context:', ragError);
        trackRAGUsage(0, 0, false);
        trackAIError('RAG_FAILURE', ragError instanceof Error ? ragError.message : 'Unknown error', { userId });
        // Continue without RAG context - don't fail the whole request
      }
    }

    // Track custom event for AI chat request
    appInsights.defaultClient?.trackEvent({
      name: 'AIChatRequest',
      properties: {
        messageCount: messages.length,
        model: model,
        streaming: stream,
        ragEnabled: contextMessages.length > messages.length
      }
    });

    if (stream) {
      // Set headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Make streaming request to OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3001',
          'X-Title': 'MindX Week 3 AI Chat'
        },
        body: JSON.stringify({
          model: model,
          messages: contextMessages,
          stream: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenRouter API error:', error);
        res.write(`data: ${JSON.stringify({ error: 'AI API error', details: error })}\n\n`);
        res.end();
        
        // Track error
        appInsights.defaultClient?.trackException({
          exception: new Error(`OpenRouter API error: ${JSON.stringify(error)}`)
        });
        return;
      }

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                res.write(`data: [DONE]\n\n`);
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  fullResponse += content;
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              } catch (e) {
                // Skip invalid JSON chunks
              }
            }
          }
        }
      }

      res.end();
      
      // Save messages to conversation history
      if (lastUserMessage) {
        addMessage(userId, 'user', lastUserMessage.content);
      }
      if (fullResponse) {
        addMessage(userId, 'assistant', fullResponse);
      }

      // Track comprehensive metrics
      const duration = Date.now() - startTime;
      trackAIResponseTime(duration, model, true);
      trackFeatureUsage('chat', userId);
      
      appInsights.defaultClient?.trackMetric({
        name: 'AIChatStreamDuration',
        value: duration
      });

      appInsights.defaultClient?.trackEvent({
        name: 'AIChatCompleted',
        properties: {
          model: model,
          responseLength: fullResponse.length,
          duration: duration
        }
      });

    } else {
      // Non-streaming response
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3001',
          'X-Title': 'MindX Week 3 AI Chat'
        },
        body: JSON.stringify({
          model: model,
          messages: contextMessages,
          stream: false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenRouter API error:', error);
        
        appInsights.defaultClient?.trackException({
          exception: new Error(`OpenRouter API error: ${JSON.stringify(error)}`)
        });
        
        return res.status(response.status).json({ error: 'AI API error', details: error });
      }

      const data = await response.json() as OpenRouterResponse;
      const duration = Date.now() - startTime;
      
      // Save messages to conversation history
      const userId = (req as any).user?.sub || 'anonymous';
      if (lastUserMessage) {
        addMessage(userId, 'user', lastUserMessage.content);
      }
      const assistantMessage = data.choices?.[0]?.message?.content;
      if (assistantMessage) {
        addMessage(userId, 'assistant', assistantMessage);
      }
      
      // Track comprehensive metrics
      trackAIResponseTime(duration, model, true);
      trackFeatureUsage('chat', userId);
      if (data.usage) {
        trackAITokenUsage(
          data.usage.prompt_tokens,
          data.usage.completion_tokens,
          model
        );
      }

      // Track metrics
      appInsights.defaultClient?.trackMetric({
        name: 'AIChatDuration',
        value: duration
      });

      appInsights.defaultClient?.trackEvent({
        name: 'AIChatCompleted',
        properties: {
          model: model,
          tokensUsed: data.usage?.total_tokens,
          duration: duration
        }
      });

      res.json(data);
    }

  } catch (error) {
    console.error('Chat endpoint error:', error);
    
    appInsights.defaultClient?.trackException({
      exception: error as Error
    });

    res.status(500).json({ error: 'Internal server error' });
  }
}
