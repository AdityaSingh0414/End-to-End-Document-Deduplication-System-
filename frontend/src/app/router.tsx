import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAppSelector } from '../store';

// Layouts
import { MainLayout } from './layouts/MainLayout';

// Pages
import Dashboard from '../pages/Dashboard';
import UploadCenter from '../pages/UploadCenter';
import OCRStudio from '../pages/OCRStudio';
import DuplicateCenter from '../pages/DuplicateCenter';
import SemanticSearch from '../pages/SemanticSearch';
import AIChat from '../pages/AIChat';
import VectorDatabase from '../pages/VectorDatabase';
import Analytics from '../pages/Analytics';
import Settings from '../pages/Settings';
import Login from '../pages/Login';
import DocumentComparison from '../pages/DocumentComparison';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route (redirects to home if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/upload',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <UploadCenter />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/ocr',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <OCRStudio />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/duplicates',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <DuplicateCenter />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/compare',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <DocumentComparison />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/search',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <SemanticSearch />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/chat',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <AIChat />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/vector',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <VectorDatabase />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/analytics',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Analytics />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Settings />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
