import { BookOpen, FileText, GraduationCap, LogOut, MessageCircle, Sparkles, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

const roleLabels = { student: 'Student', teacher: 'Teacher / educator', employee: 'Employee', business: 'Business professional' };

export default function WorkspaceShell({ active, children }) {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await logout(); } finally { window.location.assign('/'); }
  }

  return <main className="dashboard-shell">
    <aside className="dashboard-sidebar">
      <Link className="auth-brand dashboard-brand" to="/" aria-label="StudyRAG home"><span><GraduationCap size={26} /></span><b>Study<span>RAG</span></b></Link>
      <div className="sidebar-label">WORKSPACE</div>
      <Link className={`dash-nav ${active === 'overview' ? 'active' : ''}`} to="/app"><MessageCircle size={17} /> Overview</Link>
      <div className="sidebar-label sidebar-up-next">YOUR LEARNING SPACE</div>
      <Link className={`dash-nav ${active === 'documents' ? 'active' : ''}`} to="/app/documents"><FileText size={17} /> Documents</Link>
      <div className="dash-nav planned"><BookOpen size={17} /> Notes <span>Next</span></div>
      <div className="dash-nav planned"><Sparkles size={17} /> AI workspace <span>Next</span></div>
      <div className="sidebar-bottom"><div className="sidebar-user"><span className="user-avatar"><UserRound size={17} /></span><span><b>{user?.displayName}</b><small>{roleLabels[user?.role] || 'Member'}</small></span></div><button className="sign-out-button" onClick={handleLogout} disabled={loggingOut}><LogOut size={16} /> {loggingOut ? 'Signing out…' : 'Sign out'}</button></div>
    </aside>
    <section className="dashboard-main">
      <header className="dashboard-topbar"><span className="breadcrumb">My workspace <span>/</span> {active === 'documents' ? 'Documents' : 'Overview'}</span><span className="topbar-avatar">{user?.displayName?.slice(0, 1)?.toUpperCase() || 'S'}</span></header>
      <div className="dashboard-content">{children}</div>
    </section>
  </main>;
}
