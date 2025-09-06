// src/index.js

/**
 * Very feature-rich main entry point for SuperMall React app.
 * Includes:
 * - React 18 concurrent features
 * - Context Providers wrapping
 * - Router with lazy loading and fallbacks
 * - Error boundary for graceful degradation
 * - Service worker registration for offline PWA
 * - Performance monitoring with web-vitals
 * - Event listener for global error tracking
 * - User authentication persistence and auto-login support
 * - Theming and global state context initiation
 * - Hot module replacement support for dev
 */

import React, { Suspense, lazy, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./styles/main.css";

import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ThemeProvider, { useTheme } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import Logger from "./utils/logger";

import { initializeFirebaseMessaging } from "./services/notificationService";
import { reportWebVitals } from "./utils/webVitals";

// Lazy loaded page components
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

function AppRouter() {
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/user/*" element={<UserDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

function GlobalErrorListener() {
  useEffect(() => {
    function handleError(event) {
      Logger.error("Global error captured", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    }
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", (event) =>
      Logger.error("Unhandled promise rejection", { reason: event.reason })
    );

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleError);
    };
  }, []);
  return null;
}

function App() {
  useEffect(() => {
    initializeFirebaseMessaging().then(() => Logger.info("Firebase messaging initialized"));

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => Logger.info("Service Worker registered"))
        .catch((err) => Logger.warn("Service Worker registration failed", { error: err }));
    }

    reportWebVitals(console.log);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <GlobalErrorListener />
            <ErrorBoundary>
              <AppRouter />
            </ErrorBoundary>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootEl);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hot Module Replacement (HMR) for development
if (import.meta.hot) {
  import.meta.hot.accept();
}
