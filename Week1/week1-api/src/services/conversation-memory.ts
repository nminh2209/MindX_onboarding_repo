/**
 * In-memory conversation storage
 * In production, use Redis or a database
 */

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ConversationSession {
  userId: string;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
}

// Store sessions in memory (will be lost on restart)
const sessions = new Map<string, ConversationSession>();

// Maximum messages to keep in context
const MAX_CONTEXT_MESSAGES = 20;

/**
 * Get or create a conversation session for a user
 */
export function getSession(userId: string): ConversationSession {
  let session = sessions.get(userId);
  
  if (!session) {
    session = {
      userId,
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    sessions.set(userId, session);
    console.log(`📝 Created new conversation session for user: ${userId}`);
  }
  
  return session;
}

/**
 * Add a message to the conversation history
 */
export function addMessage(userId: string, role: 'user' | 'assistant' | 'system', content: string): void {
  const session = getSession(userId);
  
  session.messages.push({
    role,
    content,
    timestamp: new Date(),
  });
  
  session.lastActivity = new Date();
  
  // Trim old messages if exceeding limit
  if (session.messages.length > MAX_CONTEXT_MESSAGES) {
    const systemMessages = session.messages.filter(m => m.role === 'system');
    const conversationMessages = session.messages.filter(m => m.role !== 'system');
    
    // Keep system messages + last N conversation messages
    const trimmedConversation = conversationMessages.slice(-MAX_CONTEXT_MESSAGES);
    session.messages = [...systemMessages, ...trimmedConversation];
    
    console.log(`🧹 Trimmed conversation history for user ${userId} to ${session.messages.length} messages`);
  }
  
  console.log(`💬 Added ${role} message to session ${userId} (${session.messages.length} total)`);
}

/**
 * Get conversation history for a user
 */
export function getHistory(userId: string, limit?: number): Message[] {
  const session = getSession(userId);
  
  if (limit && session.messages.length > limit) {
    return session.messages.slice(-limit);
  }
  
  return session.messages;
}

/**
 * Clear conversation history for a user
 */
export function clearHistory(userId: string): void {
  const session = sessions.get(userId);
  if (session) {
    session.messages = [];
    session.lastActivity = new Date();
    console.log(`🗑️ Cleared conversation history for user: ${userId}`);
  }
}

/**
 * Get all active sessions (for monitoring)
 */
export function getActiveSessions(): ConversationSession[] {
  return Array.from(sessions.values());
}

/**
 * Clean up inactive sessions (older than 24 hours)
 */
export function cleanupInactiveSessions(): void {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  let cleaned = 0;
  for (const [userId, session] of sessions.entries()) {
    const age = now.getTime() - session.lastActivity.getTime();
    if (age > maxAge) {
      sessions.delete(userId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} inactive conversation sessions`);
  }
}

// Run cleanup every hour
setInterval(cleanupInactiveSessions, 60 * 60 * 1000);
