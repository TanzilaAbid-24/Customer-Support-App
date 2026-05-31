export interface KBDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  embedding?: number[];
  hasEmbedding?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroundingSource {
  id: string;
  title: string;
  score: number;
}

export interface SupportInquiry {
  id: string;
  customerName: string;
  customerEmail: string;
  query: string;
  response: string;
  status: 'resolved' | 'escalated';
  sources: GroundingSource[];
  createdAt: string;
  retrievalExplanation?: string; // Highlighting the thinking traces
  promptConstructed?: string;
}

export interface VectorDBStats {
  totalDocuments: number;
  totalWithEmbeddings: number;
  unembeddedCount: number;
  embeddingModel: string;
}
