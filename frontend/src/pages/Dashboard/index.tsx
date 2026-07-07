import React, { useEffect, useState } from 'react';
import { 
  FileText, ShieldCheck, Database, HardDrive, 
  AlertTriangle, ArrowRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import analyticsService from '../../services/analytics/analyticsService';
import type { AnalyticsStats } from '../../services/analytics/analyticsService';
import uploadService from '../../services/upload/uploadService';
import type { DocumentInfo } from '../../store/slices/documentSlice';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const statsData = await analyticsService.getStats();
        const docsData = await uploadService.list();
        setStats(statsData);
        setRecentDocs(docsData.slice(0, 4));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  const getTypeLabel = (mimeType: string, filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || mimeType.includes('pdf')) return 'PDF Document';
    if (ext === 'docx' || mimeType.includes('officedocument') || mimeType.includes('word')) return 'Word Document';
    if (['png', 'jpg', 'jpeg', 'tiff', 'bmp'].includes(ext || '') || mimeType.includes('image')) return 'Scanned Image';
    if (ext === 'zip' || mimeType.includes('zip') || mimeType.includes('archive')) return 'ZIP Compressed';
    return 'Document';
  };

  // Build card arrays based on API stats
  const statCards = [
    { 
      title: 'Total Documents', 
      value: stats ? stats.total_documents.toLocaleString() : '0', 
      change: 'Active in database', 
      icon: FileText, 
      color: 'var(--primary)' 
    },
    { 
      title: 'Duplicates Detected', 
      value: stats ? stats.duplicate_count.toLocaleString() : '0', 
      change: stats ? `${stats.duplicate_ratio}% duplicate ratio` : '0% duplicate ratio', 
      icon: AlertTriangle, 
      color: 'var(--error)' 
    },
    { 
      title: 'Storage Saved', 
      value: stats ? formatSize(stats.storage_saved_bytes) : '0 Bytes', 
      change: 'Optimized via archiving', 
      icon: HardDrive, 
      color: 'var(--success)' 
    },
    { 
      title: 'Vector Index Status', 
      value: stats && stats.total_documents > 0 ? 'Active' : 'Empty', 
      change: stats ? `${stats.total_documents} docs indexed` : '0 docs indexed', 
      icon: Database, 
      color: 'var(--accent-cyan)' 
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading Dashboard Overview...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Welcome header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome to the Document Deduplication System portal. Here's your workspace status.</p>
      </div>

      {/* Grid statistics */}
      <div className="dashboard-grid">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{stat.title}</p>
                <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '4px' }}>{stat.value}</h3>
                <span style={{ fontSize: '0.75rem', color: stat.title.includes('Duplicate') ? 'var(--error)' : 'var(--text-muted)' }}>
                  {stat.change}
                </span>
              </div>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={24} style={{ color: stat.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Analytics Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Recent documents table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>Recent Ingested Documents</h2>
            <button 
              onClick={() => navigate('/documents')}
              style={{
                background: 'transparent', border: 'none', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600
              }}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>
          
          {recentDocs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: '15px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No documents uploaded yet.</p>
              <button 
                onClick={() => navigate('/upload')}
                style={{
                  background: 'var(--primary)', border: 'none', color: '#fff',
                  padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600
                }}
              >
                Go to Upload Center
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>FILENAME</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>TYPE</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>SIZE</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>TIME</th>
                </tr>
              </thead>
              <tbody>
                {recentDocs.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '16px 8px', fontWeight: 500, fontSize: '0.9rem', color: '#fff' }}>{doc.filename}</td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{getTypeLabel(doc.mime_type, doc.filename)}</td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{formatSize(doc.file_size)}</td>
                    <td style={{ padding: '16px 8px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600,
                        background: doc.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                        color: doc.status === 'completed' ? 'var(--success)' : 'var(--primary)',
                        border: `1px solid ${doc.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}`
                      }}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatTime(doc.upload_time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* System Health / Operations widget */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>System Intelligence Nodes</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>OCR Worker Nodes</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>EasyOCR / PaddleOCR Active</p>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>3 / 3</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Vector Indices (Qdrant)</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Synced & Optimised</p>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>100%</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Deduplication Pipeline</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>XGBoost / Siamese active</p>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Idle</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Kafka Queue Broker</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Message Ingestion buffer</p>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>0 msg/s</span>
            </div>
          </div>
          
          <div style={{
            marginTop: 'auto', padding: '12px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)',
            display: 'flex', gap: '10px'
          }}>
            <ShieldCheck size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Corporate standard encryption is active. Document metadata is locked with AES-256 standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
