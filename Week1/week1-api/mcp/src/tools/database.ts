import { Tool } from './index.js';

export const queryDatabase: Tool = {
  name: 'query_database',
  description: 'Query user profile data from the database. Use this to get user information like name, email, or other profile details.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural language query describing what data to retrieve (e.g., "get my profile", "show my email")',
      },
    },
    required: ['query'],
  },
  execute: async (args: { query: string }) => {
    // For now, return mock data
    // In production, this would query the actual database
    const query = args.query.toLowerCase();
    
    if (query.includes('profile') || query.includes('user') || query.includes('me')) {
      return {
        success: true,
        data: {
          sub: 'user-123',
          email: 'user@example.com',
          name: 'Demo User',
          created_at: new Date().toISOString(),
        },
        message: 'Retrieved user profile successfully',
      };
    }
    
    if (query.includes('email')) {
      return {
        success: true,
        data: {
          email: 'user@example.com',
        },
        message: 'Retrieved user email',
      };
    }
    
    return {
      success: false,
      message: 'Could not understand query. Try asking about profile or email.',
    };
  },
};
