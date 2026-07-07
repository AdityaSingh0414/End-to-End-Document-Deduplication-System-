import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setDocuments, updateDocumentStatus, setSelectedDocument, setError, setLoading } from '../../store/slices/documentSlice';
import uploadService from '../../services/upload/uploadService';
import { 
  Loader2, Save, Languages, 
  Edit3, Inbox, AlertCircle, CheckCircle2 
} from 'lucide-react';

const OCRStudio: React.FC = () => {
  const dispatch = useAppDispatch();
  const { documents, selectedDocument } = useAppSelector((state) => state.document);

  const [editText, setEditText] = useState('');
  const [lang, setLang] = useState('en');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [localErr, setLocalErr] = useState('');

  // Load documents on mount
  useEffect(() => {
    const fetchDocs = async () => {
      dispatch(setLoading(true));
      try {
        const list = await uploadService.list();
        dispatch(setDocuments(list));
        if (list.length > 0 && !selectedDocument) {
          dispatch(setSelectedDocument(list[0]));
        }
      } catch (err: any) {
        dispatch(setError(err.response?.data?.detail || 'Failed to fetch documents.'));
      }
    };
    fetchDocs();
  }, [dispatch, selectedDocument]);

  // Sync edit state when selection changes
  useEffect(() => {
    if (selectedDocument) {
      setEditText(selectedDocument.ocr_text || '');
      setLang(selectedDocument.language || 'en');
      setLocalErr('');
      setSuccessMsg('');
    }
  }, [selectedDocument]);

  const handleSelectDoc = (docId: string) => {
    const doc = documents.find((d) => d.id === docId) || null;
    dispatch(setSelectedDocument(doc));
  };

  const handleSave = async () => {
    if (!selectedDocument) return;
    setIsSaving(true);
    setLocalErr('');
    setSuccessMsg('');
    try {
      const updated = await uploadService.update(selectedDocument.id, {
        ocr_text: editText,
        language: lang,
      });
      // Update locally in Redux store
      dispatch(updateDocumentStatus({
        id: updated.id,
        status: updated.status,
        ocr_text: updated.ocr_text || '',
        metadata: updated.metadata_json,
      }));
      dispatch(setSelectedDocument(updated));
      setSuccessMsg('OCR corrections and vector index updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setLocalErr(err.response?.data?.detail || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const languagesList = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi (हिन्दी)' },
    { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
    { code: 'ur', name: 'Urdu (اردو)' },
    { code: 'fr', name: 'French (Français)' },
    { code: 'de', name: 'German (Deutsch)' },
    { code: 'ja', name: 'Japanese (日本語)' },
    { code: 'zh', name: 'Chinese (中文)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', height: '100%' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff' }}>OCR Studio</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Review layout segments, correct recognized characters, and manage multi-lingual translations.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px', color: 'var(--text-muted)' }}>
          <Inbox size={48} />
          <p style={{ fontSize: '1rem' }}>No documents ingested yet. Go to Upload Center to ingest files.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
          {/* Left Panel: Document select list & parameters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '12px' }}>Ingested Archives</h3>
              <select 
                className="glass-input" 
                value={selectedDocument?.id || ''} 
                onChange={(e) => handleSelectDoc(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id} style={{ background: 'var(--bg-tertiary)', color: '#fff' }}>
                    {doc.filename}
                  </option>
                ))}
              </select>
            </div>

            {selectedDocument && (
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1rem', color: '#fff' }}>Document Information</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                    <span style={{
                      fontWeight: 600,
                      color: selectedDocument.status === 'completed' ? 'var(--success)' : 'var(--primary)'
                    }}>
                      {selectedDocument.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Document Category:</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'capitalize' }}>
                      {(selectedDocument.metadata_json?.category || 'document').replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ingestion Time:</span>
                    <span style={{ color: '#fff' }}>
                      {new Date(selectedDocument.upload_time).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>File Format:</span>
                    <span style={{ color: '#fff', textTransform: 'uppercase' }}>
                      {selectedDocument.mime_type.split('/')[1] || 'unknown'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>File Size:</span>
                    <span style={{ color: '#fff' }}>
                      {(selectedDocument.file_size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>

                {/* Auto-Summary */}
                {selectedDocument.metadata_json?.summary && (
                  <>
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>AI CONCISE SUMMARY</span>
                      <p style={{ fontSize: '0.8rem', color: '#fff', fontStyle: 'italic', margin: 0, background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px' }}>
                        "{selectedDocument.metadata_json.summary}"
                      </p>
                    </div>
                  </>
                )}

                {/* Smart Tags */}
                {selectedDocument.metadata_json?.tags && selectedDocument.metadata_json.tags.length > 0 && (
                  <>
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>SMART TAGS</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selectedDocument.metadata_json.tags.map((tag: string, i: number) => (
                          <span key={i} style={{
                            padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                            background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)',
                            border: '1px solid rgba(99, 102, 241, 0.2)'
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Handwritten Transcription Preview */}
                {selectedDocument.metadata_json?.handwriting_transcription && (
                  <>
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a855f7' }}>TrOCR HANDWRITING TRANSCRIPTION</span>
                      <p style={{ fontSize: '0.8rem', color: '#e6f4ea', margin: 0, background: 'rgba(168, 85, 247, 0.05)', padding: '10px', borderRadius: '4px', borderLeft: '3px solid #a855f7', whiteSpace: 'pre-line' }}>
                        {selectedDocument.metadata_json.handwriting_transcription}
                      </p>
                    </div>
                  </>
                )}

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>OCR MODEL RECOGNITION LANGUAGE</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Languages size={18} style={{ color: 'var(--primary)' }} />
                    <select
                      className="glass-input"
                      value={lang}
                      onChange={(e) => setLang(e.target.value)}
                      style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      {languagesList.map((item) => (
                        <option key={item.code} value={item.code} style={{ background: 'var(--bg-tertiary)', color: '#fff' }}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Text editor and preview */}
          {selectedDocument && (
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit3 size={18} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>OCR Transcription Segment</h3>
                </div>
                
                <button
                  onClick={handleSave}
                  disabled={isSaving || selectedDocument.status !== 'completed'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isSaving ? 'var(--text-disabled)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: (isSaving || selectedDocument.status !== 'completed') ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSaving ? 'none' : '0 2px 8px var(--primary-glow)'
                  }}
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin-glow" /> : <Save size={14} />}
                  {isSaving ? 'Indexing...' : 'Save & Sync'}
                </button>
              </div>

              {/* Status alerts */}
              {successMsg && (
                <div style={{
                  display: 'flex', gap: '10px', padding: '12px', borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: 'var(--success)', fontSize: '0.85rem'
                }}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                  <p>{successMsg}</p>
                </div>
              )}

              {localErr && (
                <div style={{
                  display: 'flex', gap: '10px', padding: '12px', borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: 'var(--error)', fontSize: '0.85rem'
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <p>{localErr}</p>
                </div>
              )}

              {selectedDocument.status !== 'completed' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px', color: 'var(--text-secondary)' }}>
                  <Loader2 size={36} className="animate-spin-glow" style={{ color: 'var(--primary)' }} />
                  <p style={{ fontSize: '0.9rem' }}>Document is currently processing in the background AI worker...</p>
                </div>
              ) : (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{
                    width: '100%',
                    height: '420px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    color: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  className="ocr-textarea-focus"
                />
              )}
            </div>
          )}
        </div>
      )}
      <style>{`
        .ocr-textarea-focus:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 10px var(--primary-glow) !important;
        }
      `}</style>
    </div>
  );
};

export default OCRStudio;
