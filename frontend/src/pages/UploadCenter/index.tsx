import React, { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  setDocuments, addDocument, setUploadProgress, 
  clearUploadProgress, setError, setLoading 
} from '../../store/slices/documentSlice';
import uploadService from '../../services/upload/uploadService';
import { 
  UploadCloud, FileText, Trash2, CheckCircle2, 
  Loader2, AlertCircle, Inbox 
} from 'lucide-react';

const UploadCenter: React.FC = () => {
  const dispatch = useAppDispatch();
  const { documents, uploadQueue, loading } = useAppSelector((state) => state.document);
  const [localError, setLocalError] = useState<string | null>(null);

  // Load uploaded documents on mount
  useEffect(() => {
    const fetchDocs = async () => {
      dispatch(setLoading(true));
      try {
        const list = await uploadService.list();
        dispatch(setDocuments(list));
      } catch (err: any) {
        dispatch(setError(err.response?.data?.detail || 'Failed to fetch documents.'));
      }
    };
    fetchDocs();
  }, [dispatch]);

  // Drag & drop handlers
  const onDrop = async (acceptedFiles: File[]) => {
    setLocalError(null);
    if (acceptedFiles.length === 0) return;

    acceptedFiles.forEach(async (file) => {
      const filename = file.name;
      dispatch(setUploadProgress({ filename, progress: 0 }));

      try {
        const doc = await uploadService.upload(file, (progress) => {
          dispatch(setUploadProgress({ filename, progress }));
        });
        
        // Success: Add document to list and clean up progress queue
        dispatch(addDocument(doc));
        setTimeout(() => {
          dispatch(clearUploadProgress(filename));
        }, 1500); // Leave progress bar visible briefly for positive feedback
      } catch (err: any) {
        setLocalError(`Failed to upload ${filename}: ${err.response?.data?.detail || err.message}`);
        dispatch(clearUploadProgress(filename));
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/zip': ['.zip'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']
    }
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await uploadService.delete(id);
      // Reload document list
      const list = await uploadService.list();
      dispatch(setDocuments(list));
    } catch (err: any) {
      setLocalError(err.response?.data?.detail || 'Failed to delete document.');
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff' }}>Document Ingestion Hub</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Ingest PDFs, Word files, Scanned Images, and ZIP archives. Early deduplication checks run automatically.
        </p>
      </div>

      {/* Main workspace layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Left column: upload area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div 
            {...getRootProps()} 
            className="glass-panel" 
            style={{
              padding: '40px 20px',
              border: `2px dashed ${isDragActive ? 'var(--primary)' : 'var(--glass-border)'}`,
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'var(--transition-normal)',
              background: isDragActive ? 'rgba(99, 102, 241, 0.05)' : 'var(--glass-bg)',
              boxShadow: isDragActive ? '0 0 20px var(--primary-glow)' : 'none'
            }}
          >
            <input {...getInputProps()} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <UploadCloud size={32} style={{ color: isDragActive ? 'var(--primary)' : 'var(--text-secondary)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '6px' }}>
                  {isDragActive ? 'Drop files here...' : 'Drag & Drop files here'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  or click to select from local directories
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Supported formats: PDF, DOCX, ZIP, PNG, JPG, JPEG, TIFF, BMP (Max 50MB)
              </span>
            </div>
          </div>

          {/* Upload Queue Progress */}
          {Object.keys(uploadQueue).length > 0 && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>Active Uploading Queue</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(uploadQueue).map(([filename, progress]) => (
                  <div key={filename} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.85rem', color: '#fff' }}>{filename}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: progress === 100 ? 'var(--success)' : 'var(--text-secondary)' }}>
                        {progress === 100 ? <CheckCircle2 size={16} style={{ color: 'var(--success)' }} /> : `${progress}%`}
                      </span>
                    </div>
                    {/* Progress Bar Container */}
                    <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent-pink))', transition: 'width 0.2s ease-in-out' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Local Error feedback */}
          {localError && (
            <div style={{
              display: 'flex', gap: '10px', padding: '12px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--error)', fontSize: '0.85rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <p>{localError}</p>
            </div>
          )}
        </div>

        {/* Right column: Document archive logs */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '20px' }}>Ingested Archives</h2>
          
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
              <Loader2 size={32} className="animate-spin-glow" style={{ color: 'var(--primary)' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px', color: 'var(--text-muted)' }}>
              <Inbox size={40} />
              <p style={{ fontSize: '0.9rem' }}>No documents ingested yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '400px', paddingRight: '4px' }}>
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  style={{
                    display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                    padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)',
                    transition: 'var(--transition-fast)'
                  }}
                  className="doc-row-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <FileText size={18} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.filename}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatBytes(doc.file_size)} • {new Date(doc.upload_time).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600,
                      background: doc.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                      color: doc.status === 'completed' ? 'var(--success)' : 'var(--primary)',
                      border: `1px solid ${doc.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}`
                    }}>
                      {doc.status}
                    </span>
                    
                    <button
                      onClick={() => handleDelete(doc.id)}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`
        .doc-row-item:hover {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(99,102,241,0.2) !important;
        }
      `}</style>
    </div>
  );
};

export default UploadCenter;
