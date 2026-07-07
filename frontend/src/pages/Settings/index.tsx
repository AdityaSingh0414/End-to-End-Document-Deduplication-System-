import React, { useState } from 'react';
import { useAppSelector } from '../../store';
import { 
  Save, Sliders, User, Database, CheckCircle2, Trash2, AlertTriangle 
} from 'lucide-react';
import searchService from '../../services/search/searchService';

const Settings: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  // Settings states
  const [similarityThreshold, setSimilarityThreshold] = useState(0.85);
  const [searchLimit, setSearchLimit] = useState(5);
  const [enableWSSignals, setEnableWSSignals] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [clearing, setClearing] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('System configuration variables saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleClearCache = async () => {
    if (!window.confirm("Are you sure you want to delete the storage cache? This will reset all search indices and delete cache files permanently.")) {
      return;
    }
    setClearing(true);
    setError('');
    setSuccess('');
    try {
      const res = await searchService.clearCache();
      setSuccess(res.detail || 'Storage cache cleared successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to clear storage cache.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff' }}>System Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Configure AI match thresholds, manage execution parameters, and review your account credentials.
        </p>
      </div>

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
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <p>{error}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '30px', alignItems: 'start' }}>
        {/* Left Side: System Configurations Form */}
        <form onSubmit={handleSaveSettings} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
            <Sliders size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Deduplication & Search Parameters</h3>
          </div>

          {/* Similarity Threshold Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>Deduplication Similarity Threshold</label>
              <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>
                {(similarityThreshold * 100).toFixed(0)}% Match
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Similarity threshold determines at what score duplicate recommendations are generated (Recommended: 85%).
            </p>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
              style={{
                width: '100%',
                accentColor: 'var(--primary)',
                background: 'rgba(255,255,255,0.05)',
                height: '6px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          {/* Search Limit Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>Maximum Search Matches</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Controls the number of matching text shards returned by the vector index lookup.
            </p>
            <select
              className="glass-input"
              value={searchLimit}
              onChange={(e) => setSearchLimit(parseInt(e.target.value))}
              style={{ width: '120px', padding: '8px', cursor: 'pointer' }}
            >
              {[3, 5, 10, 15, 20].map((num) => (
                <option key={num} value={num} style={{ background: 'var(--bg-tertiary)', color: '#fff' }}>
                  {num} matches
                </option>
              ))}
            </select>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          {/* Toggle Switches */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>Real-Time Signals</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="ws-signals"
                checked={enableWSSignals}
                onChange={(e) => setEnableWSSignals(e.target.checked)}
                style={{
                  width: '18px', height: '18px', accentColor: 'var(--primary)',
                  cursor: 'pointer', borderRadius: '4px'
                }}
              />
              <label htmlFor="ws-signals" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Enable background task notifications over WebSockets.
              </label>
            </div>
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '8px',
              width: 'fit-content',
              marginTop: '10px',
              boxShadow: '0 4px 12px var(--primary-glow)',
              transition: 'all 0.2s ease'
            }}
          >
            <Save size={16} /> Save Configurations
          </button>
        </form>

        {/* Right Side: Account Credentials Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
              <User size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1rem', color: '#fff' }}>Operator Profile</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  OPERATOR USERNAME
                </label>
                <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                  {user?.email.split('@')[0] || 'admin'}
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  EMAIL ADDRESS
                </label>
                <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                  {user?.email || 'admin@enterprise.ai'}
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  ACCOUNT SECURITY ROLE
                </label>
                <span style={{ 
                  fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase',
                  color: user?.role === 'admin' ? 'var(--error)' : 'var(--success)',
                  background: user?.role === 'admin' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                  padding: '3px 8px', borderRadius: '4px', display: 'inline-block'
                }}>
                  {user?.role || 'admin'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
              <Database size={18} style={{ color: 'var(--accent-cyan)' }} />
              <h3 style={{ fontSize: '1rem', color: '#fff' }}>Ingest Configs</h3>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                LOCAL FILE SYSTEM DIRECTORY
              </label>
              <code style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                storage_data/
              </code>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
              <Trash2 size={18} style={{ color: 'var(--error)' }} />
              <h3 style={{ fontSize: '1rem', color: '#fff' }}>Storage Cache</h3>
            </div>

            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                Clearing the cache will erase the local FAISS index, model cache, and reset the vector store. This action is irreversible.
              </p>
              <button
                type="button"
                onClick={handleClearCache}
                disabled={clearing || user?.role !== 'admin'}
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: user?.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  border: user?.role === 'admin' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                  color: user?.role === 'admin' ? 'var(--error)' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: user?.role === 'admin' ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: 'fit-content',
                  transition: 'all 0.2s ease',
                  opacity: user?.role === 'admin' ? 1 : 0.6
                }}
              >
                <Trash2 size={16} /> {clearing ? 'Clearing Cache...' : 'Clear Storage Cache'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
