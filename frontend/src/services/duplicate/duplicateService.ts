import apiClient from '../../lib/axios';

export interface ExplanationJson {
  summary: string;
  text_similarity: number;
  ocr_accuracy: number;
  image_similarity: number;
  metadata_match: number;
  recommendation: string;
}

export interface DuplicateItem {
  id: number;
  document_id: string;
  document_name: string;
  duplicate_document_id: string;
  duplicate_document_name: string;
  similarity_score: number;
  duplicate_type: 'exact' | 'partial' | 'semantic' | 'ocr' | 'handwritten';
  explanation: string | null;
  explanation_json: ExplanationJson | null;
  is_dismissed: boolean;
  created_at: string;
}

export interface RecommendationItem {
  id: number;
  document_id: string;
  document_name: string;
  recommendation_type: 'delete' | 'merge' | 'archive' | 'compress';
  status: 'pending' | 'applied' | 'ignored';
  score: number;
  reason: string | null;
  priority: 'high' | 'medium' | 'low' | null;
  created_at: string;
}

export interface CompareLine {
  type: 'equal' | 'added' | 'removed' | 'modified' | 'empty';
  value: string;
}

export interface CompareRow {
  left: CompareLine;
  right: CompareLine;
}

export interface CompareResult {
  doc1: {
    id: string;
    filename: string;
    category: string;
    language: string | null;
  };
  doc2: {
    id: string;
    filename: string;
    category: string;
    language: string | null;
  };
  diff: CompareRow[];
}

export const duplicateService = {
  list: async (): Promise<DuplicateItem[]> => {
    const response = await apiClient.get<DuplicateItem[]>('/duplicates');
    return response.data;
  },

  dismiss: async (dupId: number): Promise<void> => {
    await apiClient.post(`/duplicates/${dupId}/dismiss`);
  },

  listRecommendations: async (): Promise<RecommendationItem[]> => {
    const response = await apiClient.get<RecommendationItem[]>('/duplicates/recommendations');
    return response.data;
  },

  applyRecommendation: async (recId: number): Promise<void> => {
    await apiClient.post(`/duplicates/recommendations/${recId}/apply`);
  },

  compare: async (doc1Id: string, doc2Id: string): Promise<CompareResult> => {
    const response = await apiClient.get<CompareResult>('/duplicates/compare', {
      params: { doc1_id: doc1Id, doc2_id: doc2Id }
    });
    return response.data;
  },
};

export default duplicateService;
