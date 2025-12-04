import { queryDatabase } from './database.js';
import { searchKnowledge } from './knowledge.js';
import { callExternalApi } from './api.js';

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: any) => Promise<any>;
}

export const tools: Tool[] = [
  queryDatabase,
  searchKnowledge,
  callExternalApi,
];
