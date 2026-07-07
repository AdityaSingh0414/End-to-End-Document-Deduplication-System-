import React, { useState } from 'react';
import { Search, FileText, Compass, AlertCircle, Loader2 } from 'lucide-react';
import searchService from '../../services/search/searchService';
import type { SearchResult } from '../../services/search/searchService';

const SemanticSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setHasSearched(true);
    
    try {
      const data = await searchService.query(query);
      setResults(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Vector lookup query failed.');
    } finally {
      setLoading(false);
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
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff' }}>Semantic Search</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Query document definitions, semantic concepts, and topics instead of simple exact-word keywords.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="glass-input"
            placeholder="Type concepts (e.g. 'quarterly expenses statement' or 'system guidelines handbook')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '44px' }}
          />
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', left: '16px', top: '50%', 
              transform: 'translateY(-50%)', color: 'var(--text-muted)' 
            }} 
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            padding: '12px 24px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: (loading || !query.trim()) ? 'var(--text-disabled)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: '#fff',
            fontWeight: 600,
            cursor: (loading || !query.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: (loading || !query.trim()) ? 'none' : '0 4px 12px var(--primary-glow)'
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin-glow" /> : <Search size={16} />}
          Search
        </button>
      </form>

      {/* Error display */}
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

      {/* Search results list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }}>
          <Loader2 size={36} className="animate-spin-glow" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Scanning vector FAISS embeddings...</p>
        </div>
      ) : results.length === 0 ? (
        hasSearched && (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px', color: 'var(--text-muted)' }}>
            <Compass size={40} />
            <p style={{ fontSize: '0.95rem' }}>No matching semantic segments found in vector collections.</p>
          </div>
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Search Matches ({results.length})</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {results.map((result) => (
              <div 
                key={result.id} 
                className="glass-card" 
                style={{ 
                  display: 'flex', flexDirection: 'column', gap: '14px', 
                  borderLeft: '4px solid var(--primary)' 
                }}
              >
                {/* Result header */}
                <div style={{ display: 'flex', justifyItems: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={18} style={{ color: 'var(--primary)' }} />
                    <h4 style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>{result.filename}</h4>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Size: {formatBytes(result.file_size)} • Ingested: {new Date(result.upload_time).toLocaleDateString()}
                    </span>
                    
                    {/* Confidence Score Badge */}
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: 'rgba(99,102,241,0.1)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      boxShadow: '0 0 8px rgba(99,102,241,0.1)'
                    }}>
                      {(result.score * 100).toFixed(1)}% Match
                    </span>
                  </div>
                </div>

                {/* Snippet preview */}
                <div style={{
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid var(--glass-border)',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  fontFamily: 'monospace'
                }}>
                  {result.excerpt}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SemanticSearch;
