import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HardDrive, ShieldCheck, CheckCircle2, 
  XOctagon, Loader2, RefreshCw, AlertCircle, ArrowRight,
  Bot, Eye, AlertTriangle
} from 'lucide-react';
import duplicateService from '../../services/duplicate/duplicateService';
import type { DuplicateItem, RecommendationItem } from '../../services/duplicate/duplicateService';

const DuplicateCenter: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'duplicates' | 'recommendations'>('duplicates');
  const [duplicates, setDuplicates] = useState<DuplicateItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [expandedDupId, setExpandedDupId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'duplicates') {
        const dups = await duplicateService.list();
        setDuplicates(dups);
      } else {
        const recs = await duplicateService.listRecommendations();
        setRecommendations(recs);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load deduplication logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDismissDuplicate = async (dupId: number) => {
    try {
      await duplicateService.dismiss(dupId);
      setSuccess('Duplicate alert dismissed successfully.');
      setTimeout(() => setSuccess(''), 2000);
      setDuplicates((prev) => prev.filter((d) => d.id !== dupId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to dismiss duplicate.');
    }
  };

  const handleApplyRecommendation = async (recId: number) => {
    setApplyingId(recId);
    setError('');
    try {
      await duplicateService.applyRecommendation(recId);
      setSuccess('Recommendation executed and storage optimized!');
      setTimeout(() => setSuccess(''), 3000);
      // Reload recommendations
      const recs = await duplicateService.listRecommendations();
      setRecommendations(recs);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to apply recommendation.');
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyItems: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff' }}>Deduplication Center</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Isolate semantic text overlap, verify visual duplicates, and apply recommended storage actions.
          </p>
        </div>
        
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--glass-border)',
            padding: '10px',
            borderRadius: '50%',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin-glow' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveTab('duplicates')}
          style={{
            background: 'transparent', border: 'none',
            padding: '12px 16px', fontSize: '0.95rem', fontWeight: 600,
            cursor: 'pointer', color: activeTab === 'duplicates' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'duplicates' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'var(--transition-fast)'
          }}
        >
          Active Duplicate Alerts ({activeTab === 'duplicates' ? duplicates.length : '...'})
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          style={{
            background: 'transparent', border: 'none',
            padding: '12px 16px', fontSize: '0.95rem', fontWeight: 600,
            cursor: 'pointer', color: activeTab === 'recommendations' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'recommendations' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'var(--transition-fast)'
          }}
        >
          Storage Optimizations
        </button>
      </div>

      {/* Info messages */}
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

      {/* Lists */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }}>
          <Loader2 size={36} className="animate-spin-glow" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Comparing file hashes and semantic spaces...</p>
        </div>
      ) : activeTab === 'duplicates' ? (
        duplicates.length === 0 ? (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={44} style={{ color: 'var(--success)' }} />
            <h3 style={{ color: '#fff', fontSize: '1.1rem' }}>No Duplicates Found</h3>
            <p style={{ fontSize: '0.85rem' }}>All ingested archives represent unique information indices.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {duplicates.map((dup) => {
              const typeColors = (() => {
                switch (dup.duplicate_type) {
                  case 'exact':
                    return { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--error)', border: 'rgba(239, 68, 68, 0.2)', label: 'exact' };
                  case 'ocr':
                    return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)', label: 'OCR duplicate' };
                  case 'handwritten':
                    return { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.2)', label: 'handwritten' };
                  case 'semantic':
                    return { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--warning)', border: 'rgba(245, 158, 11, 0.2)', label: 'semantic' };
                  default:
                    return { bg: 'rgba(6, 182, 212, 0.1)', text: 'var(--accent-cyan)', border: 'rgba(6, 182, 212, 0.2)', label: 'partial' };
                }
              })();

              return (
                <div key={dup.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div 
                    className="glass-card" 
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                      gap: '20px', borderLeft: `4px solid ${typeColors.text}` 
                    }}
                  >
                    {/* File comparison info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ORIGINAL INGESTED</span>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dup.duplicate_document_name}
                        </p>
                      </div>

                      <ArrowRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>NEW DUPLICATE COPY</span>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dup.document_name}
                        </p>
                      </div>
                    </div>

                    {/* Score & Type badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
                        background: typeColors.bg,
                        color: typeColors.text,
                        border: `1px solid ${typeColors.border}`,
                        textTransform: 'uppercase'
                      }}>
                        {typeColors.label}
                      </span>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '4px' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                          {(dup.similarity_score * 100).toFixed(0)}%
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>overlap</span>
                      </div>

                      {/* Side-by-side Compare */}
                      <button
                        onClick={() => navigate(`/compare?doc1=${dup.duplicate_document_id}&doc2=${dup.document_id}`)}
                        style={{
                          background: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px',
                          transition: 'var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                      >
                        <Eye size={12} /> Compare
                      </button>

                      {/* AI Explanation Toggle */}
                      <button
                        onClick={() => setExpandedDupId(expandedDupId === dup.id ? null : dup.id)}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--glass-border)',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          color: expandedDupId === dup.id ? 'var(--primary)' : 'var(--text-secondary)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          transition: 'var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      >
                        <Bot size={12} /> Explanation
                      </button>

                      <button
                        onClick={() => handleDismissDuplicate(dup.id)}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--glass-border)',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--error)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '4px',
                          transition: 'var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      >
                        <XOctagon size={12} /> Dismiss
                      </button>
                    </div>
                  </div>

                  {/* AI Explanation Sub-Panel */}
                  {expandedDupId === dup.id && dup.explanation_json && (
                    <div 
                      className="glass-panel" 
                      style={{ 
                        marginLeft: '4px',
                        padding: '16px 20px', 
                        background: 'rgba(0, 0, 0, 0.15)', 
                        border: '1px solid var(--glass-border)', 
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '14px',
                        animation: 'fadeIn 0.2s ease-in-out'
                      }}
                    >
                      <h5 style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                        <Bot size={14} style={{ color: 'var(--primary)' }} /> Explainable AI (XAI) Feature Importance & Recommendation
                      </h5>
                      
                      {/* Metrics breakdown */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Text Overlap</span>
                          <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', margin: '4px 0 0 0' }}>
                            {dup.explanation_json.text_similarity}%
                          </p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>OCR Accuracy</span>
                          <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-pink)', margin: '4px 0 0 0' }}>
                            {dup.explanation_json.ocr_accuracy}%
                          </p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Image Sim.</span>
                          <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)', margin: '4px 0 0 0' }}>
                            {dup.explanation_json.image_similarity}%
                          </p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Metadata Match</span>
                          <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)', margin: '4px 0 0 0' }}>
                            {dup.explanation_json.metadata_match}%
                          </p>
                        </div>
                      </div>

                      {/* Explanation Texts */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', lineHeight: '1.5' }}>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          <b>AI Diagnostics</b>: {dup.explanation_json.summary}
                        </div>
                        <div style={{ 
                          color: '#fff', 
                          background: 'rgba(99, 102, 241, 0.08)', 
                          padding: '10px 14px', 
                          borderRadius: '4px', 
                          borderLeft: '4px solid var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <AlertTriangle size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <span><b>Policy Recommendation</b>: {dup.explanation_json.recommendation}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        recommendations.length === 0 ? (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={44} style={{ color: 'var(--success)' }} />
            <h3 style={{ color: '#fff', fontSize: '1.1rem' }}>Storage Space Optimized</h3>
            <p style={{ fontSize: '0.85rem' }}>No storage recommendations pending. All space values are in normal status.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recommendations.map((rec) => {
              const priorityColors = (() => {
                switch (rec.priority) {
                  case 'high':
                    return { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--error)', border: 'rgba(239, 68, 68, 0.2)' };
                  case 'medium':
                    return { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--warning)', border: 'rgba(245, 158, 11, 0.2)' };
                  default:
                    return { bg: 'rgba(6, 182, 212, 0.1)', text: 'var(--accent-cyan)', border: 'rgba(6, 182, 212, 0.2)' };
                }
              })();

              return (
                <div 
                  key={rec.id} 
                  className="glass-card" 
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                    gap: '20px', borderLeft: `4px solid ${priorityColors.text}` 
                  }}
                >
                  {/* Recommendation detail */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: priorityColors.bg, border: `1px solid ${priorityColors.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <HardDrive size={20} style={{ color: priorityColors.text }} />
                    </div>
                    
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600, margin: 0 }}>
                          Optimize: {rec.document_name}
                        </h4>
                        <span style={{
                          padding: '2px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 600,
                          background: priorityColors.bg, color: priorityColors.text, border: `1px solid ${priorityColors.border}`,
                          textTransform: 'uppercase'
                        }}>
                          {rec.priority || 'low'} priority
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
                        Recommendation Type: <b>{rec.recommendation_type.toUpperCase()}</b> • Overlap Score: {(rec.score * 100).toFixed(0)}%
                      </p>
                      {rec.reason && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                          Reason: {rec.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Apply recommendation button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => handleApplyRecommendation(rec.id)}
                      disabled={applyingId === rec.id}
                      style={{
                        background: 'linear-gradient(135deg, var(--accent-cyan), var(--primary))',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: applyingId === rec.id ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        boxShadow: '0 2px 8px rgba(6,182,212,0.2)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {applyingId === rec.id ? <Loader2 size={14} className="animate-spin-glow" /> : <HardDrive size={14} />}
                      Execute {rec.recommendation_type === 'delete' ? 'Deduplication' : rec.recommendation_type}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default DuplicateCenter;
