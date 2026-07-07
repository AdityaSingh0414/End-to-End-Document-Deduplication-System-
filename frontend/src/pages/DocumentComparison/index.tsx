import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, FileText, CheckCircle, HelpCircle, Layers, Eye } from 'lucide-react';
import duplicateService from '../../services/duplicate/duplicateService';
import type { CompareResult } from '../../services/duplicate/duplicateService';

const DocumentComparison: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const doc1Id = searchParams.get('doc1');
  const doc2Id = searchParams.get('doc2');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compareData, setCompareData] = useState<CompareResult | null>(null);

  useEffect(() => {
    const fetchComparison = async () => {
      if (!doc1Id || !doc2Id) {
        setError('Missing document ID parameters.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await duplicateService.compare(doc1Id, doc2Id);
        setCompareData(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to generate document comparison.');
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, [doc1Id, doc2Id]);

  const getLineStyle = (type: string, isLeft: boolean) => {
    switch (type) {
      case 'added':
        return {
          background: 'rgba(16, 185, 129, 0.15)', // transparent emerald
          borderLeft: '3px solid rgba(16, 185, 129, 0.6)',
          color: '#e6f4ea'
        };
      case 'removed':
        return {
          background: 'rgba(239, 68, 68, 0.15)', // transparent crimson
          borderLeft: '3px solid rgba(239, 68, 68, 0.6)',
          color: '#fce8e6'
        };
      case 'modified':
        return {
          background: 'rgba(245, 158, 11, 0.15)', // transparent amber
          borderLeft: '3px solid rgba(245, 158, 11, 0.6)',
          color: '#fef7e0'
        };
      case 'empty':
        return {
          background: 'rgba(255, 255, 255, 0.01)',
          borderLeft: '3px solid transparent',
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 2px, transparent 2px, transparent 10px)',
          color: 'rgba(255, 255, 255, 0.15)'
        };
      default:
        return {
          background: 'transparent',
          borderLeft: '3px solid transparent',
          color: 'var(--text-secondary)'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => navigate('/duplicates')}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--glass-border)',
            padding: '10px',
            borderRadius: '50%',
            cursor: 'pointer',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '4px' }}>Visual Document Comparison</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Comparing textual differences side-by-side to track additions, deletions, and updates.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px' }}>
          <Loader2 size={44} className="animate-spin-glow" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Analyzing text streams and aligning lines...</p>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--error)' }}>
          <HelpCircle size={44} style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Comparison Failed</h3>
          <p style={{ fontSize: '0.9rem' }}>{error}</p>
        </div>
      ) : compareData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          {/* Metadata Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Doc 1 (Left) */}
            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <FileText size={20} style={{ color: 'var(--error)' }} />
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ORIGINAL DOCUMENT (A)</span>
                <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {compareData.doc1.filename}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Category: <span style={{ textTransform: 'capitalize' }}>{compareData.doc1.category.replace('_', ' ')}</span> • Lang: {(compareData.doc1.language || 'en').toUpperCase()}
                </p>
              </div>
            </div>

            {/* Doc 2 (Right) */}
            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Eye size={20} style={{ color: 'var(--success)' }} />
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>COMPARED DUPLICATE (B)</span>
                <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {compareData.doc2.filename}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Category: <span style={{ textTransform: 'capitalize' }}>{compareData.doc2.category.replace('_', ' ')}</span> • Lang: {(compareData.doc2.language || 'en').toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="glass-panel" style={{ padding: '10px 20px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Legend:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.2)', borderLeft: '3px solid rgba(16, 185, 129, 0.6)' }} />
              <span style={{ color: '#e6f4ea' }}>🟢 Added</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.2)', borderLeft: '3px solid rgba(239, 68, 68, 0.6)' }} />
              <span style={{ color: '#fce8e6' }}>🔴 Removed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.2)', borderLeft: '3px solid rgba(245, 158, 11, 0.6)' }} />
              <span style={{ color: '#fef7e0' }}>🟡 Modified</span>
            </div>
          </div>

          {/* Side-by-side Viewport */}
          <div 
            className="glass-panel" 
            style={{ 
              flex: 1, 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              overflow: 'hidden', 
              padding: '0px', 
              border: '1px solid var(--glass-border)',
              height: '520px'
            }}
          >
            {/* Left Column (Doc A) */}
            <div style={{ overflowY: 'auto', borderRight: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '16px 0' }}>
                {compareData.diff.map((row, idx) => (
                  <div 
                    key={`left-${idx}`} 
                    style={{ 
                      display: 'flex', 
                      fontSize: '0.85rem', 
                      lineHeight: '1.6', 
                      fontFamily: 'Fira Code, monospace',
                      whiteSpace: 'pre-wrap',
                      ...getLineStyle(row.left.type, true)
                    }}
                  >
                    {/* Line number */}
                    <div style={{ 
                      width: '40px', 
                      textAlign: 'right', 
                      paddingRight: '10px', 
                      color: 'rgba(255, 255, 255, 0.2)', 
                      fontSize: '0.75rem', 
                      userSelect: 'none',
                      borderRight: '1px solid rgba(255,255,255,0.05)',
                      marginRight: '8px'
                    }}>
                      {row.left.type !== 'empty' ? idx + 1 : ''}
                    </div>
                    {/* Line content */}
                    <div style={{ padding: '0 8px', flex: 1 }}>
                      {row.left.value || ' '}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column (Doc B) */}
            <div style={{ overflowY: 'auto', background: 'rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '16px 0' }}>
                {compareData.diff.map((row, idx) => (
                  <div 
                    key={`right-${idx}`} 
                    style={{ 
                      display: 'flex', 
                      fontSize: '0.85rem', 
                      lineHeight: '1.6', 
                      fontFamily: 'Fira Code, monospace',
                      whiteSpace: 'pre-wrap',
                      ...getLineStyle(row.right.type, false)
                    }}
                  >
                    {/* Line number */}
                    <div style={{ 
                      width: '40px', 
                      textAlign: 'right', 
                      paddingRight: '10px', 
                      color: 'rgba(255, 255, 255, 0.2)', 
                      fontSize: '0.75rem', 
                      userSelect: 'none',
                      borderRight: '1px solid rgba(255,255,255,0.05)',
                      marginRight: '8px'
                    }}>
                      {row.right.type !== 'empty' ? idx + 1 : ''}
                    </div>
                    {/* Line content */}
                    <div style={{ padding: '0 8px', flex: 1 }}>
                      {row.right.value || ' '}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DocumentComparison;
