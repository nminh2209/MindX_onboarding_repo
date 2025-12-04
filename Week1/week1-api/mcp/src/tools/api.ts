import { Tool } from './index.js';

export const callExternalApi: Tool = {
  name: 'call_api',
  description: 'Make HTTP requests to external APIs. Useful for fetching weather, news, or other external data.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The API endpoint URL to call',
      },
      method: {
        type: 'string',
        description: 'HTTP method (GET, POST, etc.)',
        enum: ['GET', 'POST', 'PUT', 'DELETE'],
        default: 'GET',
      },
      headers: {
        type: 'object',
        description: 'Optional HTTP headers',
      },
      body: {
        type: 'object',
        description: 'Optional request body for POST/PUT',
      },
    },
    required: ['url'],
  },
  execute: async (args: { url: string; method?: string; headers?: Record<string, string>; body?: any }) => {
    try {
      const method = args.method || 'GET';
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...args.headers,
        },
      };

      if (args.body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(args.body);
      }

      const response = await fetch(args.url, options);
      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data,
        message: response.ok ? 'API call successful' : 'API call failed',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        message: 'Failed to call external API',
      };
    }
  },
};
