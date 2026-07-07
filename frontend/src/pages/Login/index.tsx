import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { authStart, authSuccess, authFailure } from '../../store/slices/authSlice';
import { Database, AlertCircle, Info } from 'lucide-react';
import authService from '../../services/auth/authService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('admin@enterprise.ai');
  const [password, setPassword] = useState('admin123');

  const tokenExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(authStart());
    
    try {
      const response = await authService.login({ email, password });
      dispatch(authSuccess({
        user: response.user,
        token: response.access_token
      }));
      navigate('/');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Authentication failed. Please verify credentials.';
      dispatch(authFailure(errorMsg));
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg-primary)', padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '420px', padding: '40px 30px',
        display: 'flex', flexDirection: 'column', gap: '24px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-pink))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px var(--primary-glow)'
          }}>
            <Database size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', fontFamily: 'Outfit' }}>
            ANTIGRAVITY AI
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Enterprise AI Document Intelligence
          </p>
        </div>

        {/* Info alerts */}
        {tokenExpired && (
          <div style={{
            display: 'flex', gap: '10px', padding: '12px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--error)', fontSize: '0.8rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <p>Session expired. Please log in again.</p>
          </div>
        )}

        <div style={{
          display: 'flex', gap: '10px', padding: '12px', borderRadius: 'var(--radius-sm)',
          background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
          color: 'var(--primary)', fontSize: '0.8rem'
        }}>
          <Info size={16} style={{ flexShrink: 0, color: 'var(--primary)' }} />
          <p>Login with email <b>admin@enterprise.ai</b> and password <b>admin123</b>.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>EMAIL ADDRESS</label>
            <input
              type="email"
              className="glass-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PASSWORD</label>
            <input
              type="password"
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p style={{ color: 'var(--error)', fontSize: '0.8rem', fontWeight: 500, textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: loading ? 'var(--text-disabled)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginTop: '10px',
              boxShadow: loading ? 'none' : '0 4px 15px var(--primary-glow)'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
