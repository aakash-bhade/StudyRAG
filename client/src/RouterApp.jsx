import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LandingPage from './App.jsx';
import AuthPage from './features/auth/AuthPage.jsx';
import DashboardPage from './features/dashboard/DashboardPage.jsx';
import DocumentsPage from './features/documents/DocumentsPage.jsx';
import ChatPage from './features/chat/ChatPage.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-loading"><span className="loading-orbit" />Checking your session…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-loading"><span className="loading-orbit" />Checking your session…</div>;
  return user ? <Navigate to="/app" replace /> : children;
}

export default function RouterApp() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<GuestRoute><AuthPage mode="login" /></GuestRoute>} />
    <Route path="/signup" element={<GuestRoute><AuthPage mode="signup" /></GuestRoute>} />
    <Route path="/app" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/app/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
    <Route path="/app/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
