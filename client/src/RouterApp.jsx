import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LandingPage from './App.jsx';
import AuthPage from './features/auth/AuthPage.jsx';
import DashboardPage from './features/dashboard/DashboardPage.jsx';
import DocumentsPage from './features/documents/DocumentsPage.jsx';
import ChatPage from './features/chat/ChatPage.jsx';
import NotesPage from './features/notes/NotesPage.jsx';
import SourcesPage from './features/sources/SourcesPage.jsx';
import QuizzesPage from './features/quizzes/QuizzesPage.jsx';
import TasksPage from './features/tasks/TasksPage.jsx';
import SettingsPage from './features/settings/SettingsPage.jsx';
import AssignmentsPage from './features/assignments/AssignmentsPage.jsx';
import SavedItemsPage from './features/saved/SavedItemsPage.jsx';
import NotificationsPage from './features/notifications/NotificationsPage.jsx';
import EmailActionPage from './features/auth/EmailActionPage.jsx';
import FlashcardsPage from './features/flashcards/FlashcardsPage.jsx';

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
    <Route path="/forgot-password" element={<GuestRoute><EmailActionPage mode="forgot" /></GuestRoute>} />
    <Route path="/verify-email/pending" element={<GuestRoute><EmailActionPage mode="pending" /></GuestRoute>} />
    <Route path="/verify-email" element={<GuestRoute><EmailActionPage mode="verify" /></GuestRoute>} />
    <Route path="/reset-password" element={<GuestRoute><EmailActionPage mode="reset" /></GuestRoute>} />
    <Route path="/app" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/app/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
    <Route path="/app/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
    <Route path="/app/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
    <Route path="/app/sources" element={<ProtectedRoute><SourcesPage /></ProtectedRoute>} />
    <Route path="/app/quizzes" element={<ProtectedRoute><QuizzesPage /></ProtectedRoute>} />
    <Route path="/app/flashcards" element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
    <Route path="/app/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
    <Route path="/app/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    <Route path="/app/assignments" element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
    <Route path="/app/saved" element={<ProtectedRoute><SavedItemsPage /></ProtectedRoute>} />
    <Route path="/app/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
