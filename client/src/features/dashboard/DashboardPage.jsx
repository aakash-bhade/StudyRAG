import { useState } from 'react';
import { BookOpen, FileText, GraduationCap, LogOut, MessageCircle, Settings2, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';

const roleLabels = { student: 'Student', teacher: 'Teacher / educator', employee: 'Employee', business: 'Business professional' };

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await logout(); } finally { navigate('/', { replace: true }); }
  }

  return <main className="dashboard-shell">
    <aside className="dashboard-sidebar">
      <Link className="auth-brand dashboard-brand" to="/" aria-label="StudyRAG home"><span><GraduationCap size={26} /></span><b>Study<span>RAG</span></b></Link>
      <div className="sidebar-label">WORKSPACE</div>
      <Link className="dash-nav active" to="/app"><MessageCircle size={17} /> Overview</Link>
      <div className="sidebar-label sidebar-up-next">YOUR LEARNING SPACE</div>
      <div className="dash-nav planned"><FileText size={17} /> Documents <span>Next</span></div>
      <div className="dash-nav planned"><BookOpen size={17} /> Notes <span>Next</span></div>
      <div className="dash-nav planned"><Sparkles size={17} /> AI workspace <span>Next</span></div>
      <div className="sidebar-bottom"><div className="sidebar-user"><span className="user-avatar"><UserRound size={17} /></span><span><b>{user?.displayName}</b><small>{roleLabels[user?.role] || 'Member'}</small></span></div><button className="sign-out-button" onClick={handleLogout} disabled={loggingOut}><LogOut size={16} /> {loggingOut ? 'Signing out…' : 'Sign out'}</button></div>
    </aside>
    <section className="dashboard-main">
      <header className="dashboard-topbar"><span className="breadcrumb">My workspace <span>/</span> Overview</span><span className="topbar-avatar">{user?.displayName?.slice(0, 1)?.toUpperCase() || 'S'}</span></header>
      <div className="dashboard-content">
        <div className="welcome-banner"><div><p className="eyebrow"><Sparkles size={14} /> YOUR STUDYRAG WORKSPACE</p><h1>Welcome, {user?.displayName?.split(' ')[0]}.</h1><p>Your account is ready. Your learning workspace is just getting started.</p></div><div className="welcome-illustration"><div className="welcome-orbit" /><span><GraduationCap size={38} /></span><i><Sparkles size={15} /></i></div></div>
        <div className="dashboard-section-heading"><div><h2>Your workspace</h2><p>More ways to organize and explore your knowledge are coming together.</p></div></div>
        <div className="workspace-status-card"><div className="status-icon"><Settings2 size={21} /></div><div className="status-copy"><span className="status-pill"><i /> Account active</span><h3>Your profile is set up</h3><p>Signed in as <strong>{user?.email}</strong>. Your account is set to <strong>{roleLabels[user?.role] || 'Member'}</strong>.</p></div><div className="status-check"><span>✓</span><small>Ready</small></div></div>
        <div className="next-grid"><article className="next-card"><span className="next-icon icon-blue"><FileText size={19} /></span><span className="next-label">COMING NEXT</span><h3>Your materials</h3><p>Document and website source management is the next workspace module.</p></article><article className="next-card"><span className="next-icon icon-violet"><MessageCircle size={19} /></span><span className="next-label">COMING NEXT</span><h3>Ask with context</h3><p>Grounded conversations and source references will follow the document workspace.</p></article><article className="next-card"><span className="next-icon icon-gold"><BookOpen size={19} /></span><span className="next-label">COMING NEXT</span><h3>Notes and practice</h3><p>Notes, quizzes, and study tools are planned after the core source flow.</p></article></div>
        <p className="dashboard-footnote"><ShieldCheck size={15} /> Your account is private. Only the information shown here is currently stored in your workspace.</p>
      </div>
    </section>
  </main>;
}
