import React, { useEffect, useState } from 'react';
import { 
  RefreshCw, Cpu, CheckCircle2, Loader2, AlertCircle 
} from 'lucide-react';
import searchService from '../../services/search/searchService';
import type { VectorStats } from '../../services/search/searchService';

const VectorDatabase: React.FC = () => {
  const [stats, setStats] = useState<VectorStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await searchService.getVectorStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch vector statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleReindex = async () => {
    setIsRebuilding(true);
    setError('');
    setSuccess('');
    try {
      const res = await searchService.reindex();
      setSuccess(res.detail);
      // Reload stats
      const data = await searchService.getVectorStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to rebuild vector store.');
    } finally {
      setIsRebuilding(false);
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
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff' }}>Vector Database</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Monitor semantic index shards, review vector configurations, and rebuild lookup collections.
        </p>
      </div>

      {/* Info status boxes */}
      {success && (
        <div style={{
          display: 'flex', gap: '10px', padding: '12px', borderRadius: 'var(--radius-sm)',
          background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
          color: 'var(--success)', fontSize: '0.85rem'
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex', gap: '10px', padding: '12px', borderRadius: 'var(--radius-sm)',
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
          color: 'var(--error)', fontSize: '0.85rem'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <p>{error}</p>
        </div>
      )}

      {loading && !stats ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }}>
          <Loader2 size={36} className="animate-spin-glow" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Reading FAISS memory shards...</p>
        </div>
      ) : (
        stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
            {/* Left Panel: Statistics and Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {/* Metrics cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="glass-card">
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>TOTAL VECTORS INDEXED</p>
                  <h3 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 700 }}>{stats.total_vectors}</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Semantic text shards</span>
                </div>

                <div className="glass-card">
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>EMBEDDING DIMENSIONS</p>
                  <h3 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 700 }}>{stats.dimensions}</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MiniLM vector dimensions</span>
                </div>

                <div className="glass-card">
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>INDEX SHARD FILE SIZE</p>
                  <h3 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 700 }}>{formatBytes(stats.index_file_size_bytes)}</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Persisted FAISS flat binary</span>
                </div>
              </div>

              {/* Technical Specifications Panel */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                  Index Specifications
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      INDEX SCHEME TYPE
                    </label>
                    <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{stats.index_type}</span>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      SENTENCE EMBEDDING MODEL
                    </label>
                    <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>{stats.embedding_model}</span>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      PERSISTENCE STORE CACHE DIRECTORY
                    </label>
                    <code style={{ fontSize: '0.8rem', color: 'var(--accent-pink)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {stats.cache_directory}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Reindexing Action */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1rem', color: '#fff' }}>Vector Controls</h3>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Rebuilding index synchronizes all database document textual structures. If you modify text values inside OCR studio, trigger reindexing to sync retrieval searches.
              </p>

              <button
                onClick={handleReindex}
                disabled={isRebuilding}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isRebuilding ? 'var(--text-disabled)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: isRebuilding ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: isRebuilding ? 'none' : '0 4px 12px var(--primary-glow)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isRebuilding ? <Loader2 size={16} className="animate-spin-glow" /> : <RefreshCw size={14} />}
                {isRebuilding ? 'Rebuilding Index...' : 'Re-index Database'}
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default VectorDatabase;
