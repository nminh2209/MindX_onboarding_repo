import * as appInsights from 'applicationinsights';

/**
 * AI Performance Metrics
 */
export function trackAIResponseTime(durationMs: number, model: string, success: boolean) {
  appInsights.defaultClient?.trackMetric({
    name: 'AI_ResponseTime',
    value: durationMs,
    properties: {
      model,
      success: success.toString(),
    }
  });
}

export function trackAITokenUsage(promptTokens: number, completionTokens: number, model: string) {
  appInsights.defaultClient?.trackMetric({
    name: 'AI_TokenUsage_Prompt',
    value: promptTokens,
    properties: { model }
  });
  
  appInsights.defaultClient?.trackMetric({
    name: 'AI_TokenUsage_Completion',
    value: completionTokens,
    properties: { model }
  });
  
  appInsights.defaultClient?.trackMetric({
    name: 'AI_TokenUsage_Total',
    value: promptTokens + completionTokens,
    properties: { model }
  });
}

export function trackRAGUsage(documentsRetrieved: number, topScore: number, success: boolean) {
  appInsights.defaultClient?.trackEvent({
    name: 'RAG_KnowledgeRetrieval',
    properties: {
      documentsRetrieved: documentsRetrieved.toString(),
      topScore: topScore.toString(),
      success: success.toString(),
    }
  });
}

export function trackToolExecution(toolName: string, durationMs: number, success: boolean, error?: string) {
  appInsights.defaultClient?.trackEvent({
    name: 'MCP_ToolExecution',
    properties: {
      toolName,
      durationMs: durationMs.toString(),
      success: success.toString(),
      error: error || '',
    }
  });
  
  appInsights.defaultClient?.trackMetric({
    name: 'MCP_ToolExecutionTime',
    value: durationMs,
    properties: { toolName, success: success.toString() }
  });
}

/**
 * User Engagement Metrics
 */
export function trackChatSession(userId: string, messageCount: number, durationMs: number) {
  appInsights.defaultClient?.trackEvent({
    name: 'ChatSession',
    properties: {
      userId,
      messageCount: messageCount.toString(),
      durationMs: durationMs.toString(),
    }
  });
  
  appInsights.defaultClient?.trackMetric({
    name: 'ChatSession_Duration',
    value: durationMs,
    properties: { userId }
  });
  
  appInsights.defaultClient?.trackMetric({
    name: 'ChatSession_MessageCount',
    value: messageCount,
    properties: { userId }
  });
}

export function trackFeatureUsage(feature: 'chat' | 'knowledge_ingest' | 'tool_call' | 'rag_search', userId: string) {
  appInsights.defaultClient?.trackEvent({
    name: 'FeatureUsage',
    properties: {
      feature,
      userId,
      timestamp: new Date().toISOString(),
    }
  });
}

export function trackKnowledgeIngestion(documentCount: number, success: boolean, durationMs: number) {
  appInsights.defaultClient?.trackEvent({
    name: 'KnowledgeIngestion',
    properties: {
      documentCount: documentCount.toString(),
      success: success.toString(),
      durationMs: durationMs.toString(),
    }
  });
  
  appInsights.defaultClient?.trackMetric({
    name: 'KnowledgeIngestion_Duration',
    value: durationMs,
    properties: { success: success.toString() }
  });
}

/**
 * Error Tracking
 */
export function trackAIError(errorType: string, errorMessage: string, context: Record<string, string>) {
  appInsights.defaultClient?.trackException({
    exception: new Error(`AI Error: ${errorType} - ${errorMessage}`),
    properties: {
      errorType,
      ...context,
    }
  });
}

export function trackSystemHealth(component: string, healthy: boolean, details?: string) {
  appInsights.defaultClient?.trackEvent({
    name: 'SystemHealth',
    properties: {
      component,
      healthy: healthy.toString(),
      details: details || '',
      timestamp: new Date().toISOString(),
    }
  });
}
