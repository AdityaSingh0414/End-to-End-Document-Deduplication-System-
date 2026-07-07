import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface DocumentInfo {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_hash: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  metadata_json: any | null;
  ocr_text: string | null;
  language: string | null;
  upload_time: string;
}

export interface DuplicateInfo {
  id: number;
  document_id: string;
  duplicate_document_id: string;
  similarity_score: number;
  duplicate_type: 'exact' | 'partial' | 'semantic';
  is_dismissed: boolean;
  created_at: string;
}

export interface RecommendationInfo {
  id: number;
  document_id: string;
  recommendation_type: 'delete' | 'merge' | 'archive' | 'compress';
  status: 'pending' | 'applied' | 'ignored';
  score: number;
  created_at: string;
}

interface DocumentState {
  documents: DocumentInfo[];
  selectedDocument: DocumentInfo | null;
  duplicates: DuplicateInfo[];
  recommendations: RecommendationInfo[];
  loading: boolean;
  error: string | null;
  uploadQueue: { [filename: string]: number }; // Progress map (0-100)
}

const initialState: DocumentState = {
  documents: [],
  selectedDocument: null,
  duplicates: [],
  recommendations: [],
  loading: false,
  error: null,
  uploadQueue: {},
};

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setDocuments: (state, action: PayloadAction<DocumentInfo[]>) => {
      state.documents = action.payload;
      state.loading = false;
    },
    addDocument: (state, action: PayloadAction<DocumentInfo>) => {
      state.documents = [action.payload, ...state.documents];
    },
    updateDocumentStatus: (
      state,
      action: PayloadAction<{ id: string; status: DocumentInfo['status']; ocr_text?: string; metadata?: any }>
    ) => {
      const doc = state.documents.find((d) => d.id === action.payload.id);
      if (doc) {
        doc.status = action.payload.status;
        if (action.payload.ocr_text !== undefined) doc.ocr_text = action.payload.ocr_text;
        if (action.payload.metadata !== undefined) doc.metadata_json = action.payload.metadata;
      }
      if (state.selectedDocument && state.selectedDocument.id === action.payload.id) {
        state.selectedDocument.status = action.payload.status;
        if (action.payload.ocr_text !== undefined) state.selectedDocument.ocr_text = action.payload.ocr_text;
        if (action.payload.metadata !== undefined) state.selectedDocument.metadata_json = action.payload.metadata;
      }
    },
    setSelectedDocument: (state, action: PayloadAction<DocumentInfo | null>) => {
      state.selectedDocument = action.payload;
    },
    setDuplicates: (state, action: PayloadAction<DuplicateInfo[]>) => {
      state.duplicates = action.payload;
    },
    setRecommendations: (state, action: PayloadAction<RecommendationInfo[]>) => {
      state.recommendations = action.payload;
    },
    setUploadProgress: (state, action: PayloadAction<{ filename: string; progress: number }>) => {
      state.uploadQueue[action.payload.filename] = action.payload.progress;
    },
    clearUploadProgress: (state, action: PayloadAction<string>) => {
      delete state.uploadQueue[action.payload];
    },
    clearAllUploadProgress: (state) => {
      state.uploadQueue = {};
    },
  },
});

export const {
  setLoading,
  setError,
  setDocuments,
  addDocument,
  updateDocumentStatus,
  setSelectedDocument,
  setDuplicates,
  setRecommendations,
  setUploadProgress,
  clearUploadProgress,
  clearAllUploadProgress,
} = documentSlice.actions;

export default documentSlice.reducer;
