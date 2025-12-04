import { Request, Response } from 'express';
import { ingestDocuments, initializeCollection } from '../services/knowledge.js';
import { trackKnowledgeIngestion, trackFeatureUsage } from '../services/metrics.js';

interface IngestRequest {
  documents: Array<{
    id?: string;
    text: string;
    metadata?: Record<string, any>;
  }>;
}

export async function handleIngest(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  try {
    const { documents } = req.body as IngestRequest;
    const userId = (req as any).user?.sub || 'anonymous';

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      res.status(400).json({ 
        error: 'Invalid request', 
        message: 'Documents array is required and must not be empty' 
      });
      return;
    }

    // Ensure collection exists
    await initializeCollection();

    // Ingest documents
    await ingestDocuments(documents);
    
    // Track metrics
    const duration = Date.now() - startTime;
    trackKnowledgeIngestion(documents.length, true, duration);
    trackFeatureUsage('knowledge_ingest', userId);

    res.json({
      success: true,
      message: `Successfully ingested ${documents.length} documents`,
      count: documents.length,
    });
  } catch (error) {
    console.error('Document ingestion error:', error);
    const duration = Date.now() - startTime;
    trackKnowledgeIngestion(0, false, duration);
    
    res.status(500).json({
      error: 'Ingestion failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
