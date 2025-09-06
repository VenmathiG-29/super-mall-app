// src/main.js

/**
 * Enhanced main entry point for SuperMall React App.
 * Includes advanced features:
 * - React 18 concurrent features & Suspense fallback
 * - Error Boundary handling for graceful UI degrade
 * - Global loading and offline state management
 * - Lazy loading routes with React.lazy and Suspense
 * - Web vitals and performance monitoring hooks
 * - Analytics and telemetry integration
 * - Service worker registration for PWA support
 * - Theming support: light/dark mode with context
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './styles/main.css';

import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CartProvider } from './contexts/CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import Logger from './utils/logger';

import ThemeProvider, { useTheme } from './contexts/ThemeContext';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy load main pages/components
const Home = lazy(() => import('./pages/Home'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const NotFound = lazy(() => import('./pages/NotFound'));

function AppRouter() {
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      Logger.info('User is back online');
    }

    function handleOffline() {
      setIsOnline(false);
      Logger.warn('User is offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Web vitals tracking example (could be expanded)
    import('web-vitals').then(({ getCLS, getFID, getLCP }) => {
      getCLS(console.log);
      getFID(console.log);
      getLCP(console.log);
    });

    // Service worker registration for pwa (optional)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').then(() => {
        Logger.info('Service worker registered');
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <ErrorBoundary>
              {!isOnline && (
                <div className="offline-banner" role="alert">
                  You are currently offline. Some features may be unavailable.
                </div>
              )}
              <AppRouter />
            </ErrorBoundary>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
