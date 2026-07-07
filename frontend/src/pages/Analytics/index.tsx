import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  FileText, ShieldCheck, HardDrive, AlertTriangle, 
  Loader2, RefreshCw, Inbox, AlertCircle 
} from 'lucide-react';
import analyticsService from '../../services/analytics/analyticsService';
import type { AnalyticsStats } from '../../services/analytics/analyticsService';

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await analyticsService.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to retrieve analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Color arrays for charts
  const PIE_COLORS = ['#6366f1', '#ec4899', '#06b6d4', '#8b5cf6'];

  // Prepare chart data if stats loaded
  const formatData = stats ? [
    { name: 'PDF', value: stats.format_distribution.pdf },
    { name: 'Word', value: stats.format_distribution.docx },
    { name: 'Images', value: stats.format_distribution.images },
    { name: 'Archives', value: stats.format_distribution.archives },
  ].filter(d => d.value > 0) : [];

  const langData = stats ? Object.entries(stats.language_distribution).map(([lang, count]) => {
    const langNames: { [key: string]: string } = {
      en: 'English', hi: 'Hindi', fr: 'French', de: 'German', 
      pa: 'Punjabi', ur: 'Urdu', ja: 'Japanese', zh: 'Chinese',
      unknown: 'Unknown'
    };
    return {
      name: langNames[lang] || lang,
      documents: count
    };
  }) : [];

  const statusData = stats ? [
    { name: 'Uploaded', documents: stats.status_distribution.uploaded, fill: '#3b82f6' },
    { name: 'Processing', documents: stats.status_distribution.processing, fill: '#f59e0b' },
    { name: 'Completed', documents: stats.status_distribution.completed, fill: '#10b981' },
    { name: 'Failed', documents: stats.status_distribution.failed, fill: '#ef4444' }
  ].filter(d => d.documents > 0) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyItems: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff' }}>Analytics & Reports</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            System processing reports, document format charts, and deduplication statistics.
          </p>
        </div>
        
        <button
          onClick={fetchStats}
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

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: '16px' }}>
          <Loader2 size={36} className="animate-spin-glow" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Aggregating system statistics...</p>
        </div>
      ) : !stats || stats.total_documents === 0 ? (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px', color: 'var(--text-muted)' }}>
          <Inbox size={48} />
          <p style={{ fontSize: '1rem' }}>No document history found to compile reports. Go to Upload Center to ingest files.</p>
        </div>
      ) : (
        <>
          {/* Stats Cards Row */}
          <div className="dashboard-grid">
            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Ingested</p>
                <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '4px' }}>{stats.total_documents}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Files recorded</span>
              </div>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FileText size={24} style={{ color: 'var(--primary)' }} />
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Duplicate Ratio</p>
                <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '4px' }}>{stats.duplicate_ratio}%</h3>
                <span style={{ fontSize: '0.75rem', color: stats.duplicate_ratio > 10 ? 'var(--error)' : 'var(--text-muted)' }}>
                  {stats.duplicate_count} files flagged
                </span>
              </div>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Storage Reclaimed</p>
                <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '4px' }}>{formatBytes(stats.storage_saved_bytes)}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Deduplication savings</span>
              </div>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <HardDrive size={24} style={{ color: 'var(--success)' }} />
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Processed Status</p>
                <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '4px' }}>
                  {((stats.status_distribution.completed / stats.total_documents) * 100).toFixed(0)}%
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {stats.status_distribution.completed} completed
                </span>
              </div>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ShieldCheck size={24} style={{ color: 'var(--accent-cyan)' }} />
              </div>
            </div>
          </div>

          {/* Charts grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Format Distribution Chart */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Ingested File Formats</h3>
              <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formatData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {formatData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-tertiary)', borderColor: 'var(--glass-border)', color: '#fff' }} />
                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Language Distribution Chart */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>OCR Recognition Languages</h3>
              <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={langData}>
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} width={30} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-tertiary)', borderColor: 'var(--glass-border)', color: '#fff' }} />
                    <Bar dataKey="documents" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution Chart (Full Width Span) */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', gridColumn: 'span 2' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>System Execution Pipeline Status</h3>
              <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical">
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ background: 'var(--bg-tertiary)', borderColor: 'var(--glass-border)', color: '#fff' }} />
                    <Bar dataKey="documents" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
