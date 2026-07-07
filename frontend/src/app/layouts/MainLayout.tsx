import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { 
  LayoutDashboard, UploadCloud, Layers, FileSearch, Eye, 
  Settings, LogOut, Database, BarChart2, MessageSquare
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload Center', path: '/upload', icon: UploadCloud },
    { name: 'OCR Studio', path: '/ocr', icon: Eye },
    { name: 'Duplicate Center', path: '/duplicates', icon: Layers },
    { name: 'Semantic Search', path: '/search', icon: FileSearch },
    { name: 'AI Chat (RAG)', path: '/chat', icon: MessageSquare },
    { name: 'Vector DB', path: '/vector', icon: Database },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar - Desktop */}
      <aside 
        className="glass-panel"
        style={{
          width: 'var(--sidebar-width)',
          position: 'fixed',
          top: '20px',
          bottom: '20px',
          left: '20px',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          zIndex: 10,
          borderRadius: 'var(--radius-lg)'
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-pink))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px var(--primary-glow)'
          }}>
            <Database size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit', background: 'linear-gradient(to right, #fff, var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Document Deduplication System
            </h2>
          </div>
        </div>

        {/* Navigation items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  background: isActive ? 'linear-gradient(90deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'all 0.2s ease'
                }}
                className={!isActive ? 'glass-nav-item' : ''}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--primary)' : 'inherit' }} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)'
            }}>
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.email?.split('@')[0]}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Role: {user?.role || 'user'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--error)',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <div style={{
        marginLeft: 'calc(var(--sidebar-width) + 40px)',
        flex: 1,
        padding: '30px 40px 40px 0px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Content Shell */}
        <main className="animate-fade-in" style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      <style>{`
        .glass-nav-item:hover {
          background: rgba(255, 255, 255, 0.03) !important;
          color: var(--text-primary) !important;
          padding-left: 18px !important;
        }
      `}</style>
    </div>
  );
};
