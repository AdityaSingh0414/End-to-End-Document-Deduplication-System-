import apiClient from '../../lib/axios';

export interface AnalyticsStats {
  total_documents: number;
  duplicate_count: number;
  duplicate_ratio: number;
  storage_saved_bytes: number;
  status_distribution: {
    uploaded: number;
    processing: number;
    completed: number;
    failed: number;
  };
  language_distribution: {
    [lang: string]: number;
  };
  format_distribution: {
    pdf: number;
    docx: number;
    images: number;
    archives: number;
  };
}

export const analyticsService = {
  getStats: async (): Promise<AnalyticsStats> => {
    const response = await apiClient.get<AnalyticsStats>('/analytics/stats');
    return response.data;
  },
};

export default analyticsService;
