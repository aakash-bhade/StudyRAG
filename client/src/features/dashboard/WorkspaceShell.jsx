import { BookOpen, ClipboardList, FileText, Globe2, GraduationCap, LogOut, MessageCircle, Sparkles, UserRound } from 'lucide-react';
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
      <Link className={`dash-nav ${active === 'sources' ? 'active' : ''}`} to="/app/sources"><Globe2 size={17} /> Websites</Link>
      <Link className={`dash-nav ${active === 'notes' ? 'active' : ''}`} to="/app/notes"><BookOpen size={17} /> Notes</Link>
      <Link className={`dash-nav ${active === 'chat' ? 'active' : ''}`} to="/app/chat"><Sparkles size={17} /> Ask materials</Link>
      <Link className={`dash-nav ${active === 'quizzes' ? 'active' : ''}`} to="/app/quizzes"><BookOpen size={17} /> Quizzes</Link>
      <Link className={`dash-nav ${active === 'tasks' ? 'active' : ''}`} to="/app/tasks"><ClipboardList size={17} /> Tasks</Link>
      <div className="sidebar-bottom"><div className="sidebar-user"><span className="user-avatar"><UserRound size={17} /></span><span><b>{user?.displayName}</b><small>{roleLabels[user?.role] || 'Member'}</small></span></div><button className="sign-out-button" onClick={handleLogout} disabled={loggingOut}><LogOut size={16} /> {loggingOut ? 'Signing out…' : 'Sign out'}</button></div>
    </aside>
    <section className="dashboard-main">
      <header className="dashboard-topbar"><span className="breadcrumb">My workspace <span>/</span> {active === 'documents' ? 'Documents' : active === 'chat' ? 'Ask materials' : active === 'notes' ? 'Notes' : active === 'sources' ? 'Website sources' : active === 'quizzes' ? 'Quizzes' : active === 'tasks' ? 'Tasks' : 'Overview'}</span><span className="topbar-avatar">{user?.displayName?.slice(0, 1)?.toUpperCase() || 'S'}</span></header>
      <div className="dashboard-content">{children}</div>
    </section>
  </main>;
}
