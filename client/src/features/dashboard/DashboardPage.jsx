import { BookOpen, FileText, GraduationCap, Settings2, ShieldCheck, MessageCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkspaceShell from './WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const roleLabels = { student: 'Student', teacher: 'Teacher / educator', employee: 'Employee', business: 'Business professional' };

  return <WorkspaceShell active="overview">
        <div className="welcome-banner"><div><p className="eyebrow"><Sparkles size={14} /> YOUR STUDYRAG WORKSPACE</p><h1>Welcome, {user?.displayName?.split(' ')[0]}.</h1><p>Your account is ready. Your learning workspace is just getting started.</p></div><div className="welcome-illustration"><div className="welcome-orbit" /><span><GraduationCap size={38} /></span><i><Sparkles size={15} /></i></div></div>
        <div className="dashboard-section-heading"><div><h2>Your workspace</h2><p>More ways to organize and explore your knowledge are coming together.</p></div></div>
        <div className="workspace-status-card"><div className="status-icon"><Settings2 size={21} /></div><div className="status-copy"><span className="status-pill"><i /> Account active</span><h3>Your profile is set up</h3><p>Signed in as <strong>{user?.email}</strong>. Your account is set to <strong>{roleLabels[user?.role] || 'Member'}</strong>.</p></div><div className="status-check"><span>✓</span><small>Ready</small></div></div>
        <div className="next-grid"><Link className="next-card" to="/app/documents"><span className="next-icon icon-blue"><FileText size={19} /></span><span className="next-label">AVAILABLE</span><h3>Your materials</h3><p>Upload and manage private PDF, DOCX, and TXT documents.</p></Link><Link className="next-card" to="/app/chat"><span className="next-icon icon-violet"><MessageCircle size={19} /></span><span className="next-label">AVAILABLE</span><h3>Ask with context</h3><p>Search your own study materials and inspect source passages.</p></Link><article className="next-card"><span className="next-icon icon-gold"><BookOpen size={19} /></span><span className="next-label">COMING NEXT</span><h3>Notes and practice</h3><p>Notes, quizzes, and study tools are planned after the core source flow.</p></article></div>
        <p className="dashboard-footnote"><ShieldCheck size={15} /> Account details are stored securely; passwords are hashed before storage.</p>
  </WorkspaceShell>;
}
