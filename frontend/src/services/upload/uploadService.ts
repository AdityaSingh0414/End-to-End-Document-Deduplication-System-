import apiClient from '../../lib/axios';
import type { DocumentInfo } from '../../store/slices/documentSlice';

export const uploadService = {
  upload: async (file: File, onProgress: (progress: number) => void): Promise<DocumentInfo> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<DocumentInfo>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },
  
  list: async (): Promise<DocumentInfo[]> => {
    const response = await apiClient.get<DocumentInfo[]>('/documents');
    return response.data;
  },
  
  delete: async (docId: string): Promise<void> => {
    await apiClient.delete(`/documents/${docId}`);
  },

  update: async (docId: string, updateData: { ocr_text?: string; language?: string }): Promise<DocumentInfo> => {
    const response = await apiClient.put<DocumentInfo>(`/documents/${docId}`, updateData);
    return response.data;
  },
};

export default uploadService;
