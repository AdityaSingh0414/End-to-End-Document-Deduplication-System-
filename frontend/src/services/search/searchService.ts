import apiClient from '../../lib/axios';

export interface SearchResult {
  id: string;
  filename: string;
  file_size: number;
  upload_time: string;
  score: number;
  excerpt: string;
}

export interface ChatResponse {
  response: string;
  referenced_doc_id: string | null;
  referenced_doc_name: string | null;
}

export interface VectorStats {
  index_type: string;
  embedding_model: string;
  dimensions: number;
  total_vectors: number;
  index_file_size_bytes: number;
  cache_directory: string;
}

export const searchService = {
  query: async (q: string, limit = 5): Promise<SearchResult[]> => {
    const response = await apiClient.get<SearchResult[]>('/search/query', {
      params: { q, limit },
    });
    return response.data;
  },

  chat: async (message: string, documentId?: string): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/search/chat', {
      message,
      document_id: documentId || null,
    });
    return response.data;
  },

  getVectorStats: async (): Promise<VectorStats> => {
    const response = await apiClient.get<VectorStats>('/search/stats');
    return response.data;
  },

  reindex: async (): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>('/search/reindex');
    return response.data;
  },

  clearCache: async (): Promise<{ detail: string }> => {
    const response = await apiClient.post<{ detail: string }>('/search/clear-cache');
    return response.data;
  },
};

export default searchService;
