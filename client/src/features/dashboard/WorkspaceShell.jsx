import { Bell, BookOpen, Bookmark, ChevronDown, ClipboardCheck, ClipboardList, FileText, Globe2, GraduationCap, Layers2, LogOut, MessageCircle, Settings, Sparkles, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

const roleLabels = { student: 'Student', teacher: 'Teacher / educator', employee: 'Employee', business: 'Business professional' };

export default function WorkspaceShell({ active, children }) {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => ({
    study: ['quizzes', 'flashcards'].includes(active),
    materials: true,
    planning: ['tasks', 'assignments', 'notifications'].includes(active),
  }));
  const toggleGroup = group => setOpenGroups(current => ({ ...current, [group]: !current[group] }));

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await logout(); } finally { window.location.assign('/'); }
  }

  return <main className={`dashboard-shell ${active === 'chat' ? 'chat-workspace' : ''}`}>
    <aside className="dashboard-sidebar">
      <Link className="auth-brand dashboard-brand" to="/" aria-label="StudyRAG home"><span><GraduationCap size={26} /></span><b>Study<span>RAG</span></b></Link>
      <div className="sidebar-label">WORKSPACE</div>
      <Link className={`dash-nav ${active === 'overview' ? 'active' : ''}`} to="/app"><MessageCircle size={17} /> Overview</Link>
      <Link className={`dash-nav ${active === 'chat' ? 'active' : ''}`} to="/app/chat"><Sparkles size={17} /> Ask materials</Link>
      <div className="sidebar-label sidebar-up-next">YOUR SPACE</div>
      <button className={`sidebar-group-toggle ${openGroups.materials ? 'open' : ''}`} onClick={() => toggleGroup('materials')} aria-expanded={openGroups.materials}><FileText size={16} /><span>Materials</span><ChevronDown size={15} /></button>
      {openGroups.materials && <div className="sidebar-group-items"><Link className={`dash-nav ${active === 'documents' ? 'active' : ''}`} to="/app/documents"><FileText size={16} /> Documents</Link><Link className={`dash-nav ${active === 'sources' ? 'active' : ''}`} to="/app/sources"><Globe2 size={16} /> Websites</Link><Link className={`dash-nav ${active === 'notes' ? 'active' : ''}`} to="/app/notes"><BookOpen size={16} /> Notes</Link><Link className={`dash-nav ${active === 'saved' ? 'active' : ''}`} to="/app/saved"><Bookmark size={16} /> Saved items</Link></div>}
      <button className={`sidebar-group-toggle ${openGroups.study ? 'open' : ''}`} onClick={() => toggleGroup('study')} aria-expanded={openGroups.study}><Layers2 size={16} /><span>Study tools</span><ChevronDown size={15} /></button>
      {openGroups.study && <div className="sidebar-group-items"><Link className={`dash-nav ${active === 'quizzes' ? 'active' : ''}`} to="/app/quizzes"><BookOpen size={16} /> Quizzes</Link><Link className={`dash-nav ${active === 'flashcards' ? 'active' : ''}`} to="/app/flashcards"><Layers2 size={16} /> Flashcards</Link></div>}
      <button className={`sidebar-group-toggle ${openGroups.planning ? 'open' : ''}`} onClick={() => toggleGroup('planning')} aria-expanded={openGroups.planning}><ClipboardList size={16} /><span>Planning</span><ChevronDown size={15} /></button>
      {openGroups.planning && <div className="sidebar-group-items"><Link className={`dash-nav ${active === 'tasks' ? 'active' : ''}`} to="/app/tasks"><ClipboardList size={16} /> Tasks</Link><Link className={`dash-nav ${active === 'assignments' ? 'active' : ''}`} to="/app/assignments"><ClipboardCheck size={16} /> Assignments</Link><Link className={`dash-nav ${active === 'notifications' ? 'active' : ''}`} to="/app/notifications"><Bell size={16} /> Notifications</Link></div>}
      <div className="sidebar-bottom"><Link className={`dash-nav ${active === 'settings' ? 'active' : ''}`} to="/app/settings"><Settings size={16} /> Settings</Link><div className="sidebar-user"><span className="user-avatar"><UserRound size={17} /></span><span><b>{user?.displayName}</b><small>{roleLabels[user?.role] || 'Member'}</small></span></div><button className="sign-out-button" onClick={handleLogout} disabled={loggingOut}><LogOut size={16} /> {loggingOut ? 'Signing out…' : 'Sign out'}</button></div>
    </aside>
    <nav className="mobile-bottom-nav" aria-label="Mobile workspace navigation">
      <Link className={active === 'overview' ? 'active' : ''} to="/app"><MessageCircle size={18} /><span>Home</span></Link>
      <Link className={active === 'chat' ? 'active' : ''} to="/app/chat"><Sparkles size={18} /><span>Ask</span></Link>
      <Link className={active === 'documents' ? 'active' : ''} to="/app/documents"><FileText size={18} /><span>Docs</span></Link>
      <Link className={active === 'notes' ? 'active' : ''} to="/app/notes"><BookOpen size={18} /><span>Notes</span></Link>
      <button className={moreOpen || ['sources', 'quizzes', 'flashcards', 'tasks', 'assignments', 'saved', 'notifications', 'settings'].includes(active) ? 'active' : ''} onClick={() => setMoreOpen(value => !value)} aria-expanded={moreOpen}><Layers2 size={18} /><span>More</span></button>
      {moreOpen && <div className="mobile-more-menu"><div className="mobile-more-user"><span className="user-avatar"><UserRound size={16} /></span><span><b>{user?.displayName}</b><small>{roleLabels[user?.role] || 'Member'}</small></span></div>
        <Link to="/app/sources" onClick={() => setMoreOpen(false)}><Globe2 size={16} /> Websites</Link><Link to="/app/quizzes" onClick={() => setMoreOpen(false)}><BookOpen size={16} /> Quizzes</Link><Link to="/app/flashcards" onClick={() => setMoreOpen(false)}><Layers2 size={16} /> Flashcards</Link><Link to="/app/tasks" onClick={() => setMoreOpen(false)}><ClipboardList size={16} /> Tasks</Link><Link to="/app/assignments" onClick={() => setMoreOpen(false)}><ClipboardCheck size={16} /> Assignments</Link><Link to="/app/saved" onClick={() => setMoreOpen(false)}><Bookmark size={16} /> Saved items</Link><Link to="/app/notifications" onClick={() => setMoreOpen(false)}><Bell size={16} /> Notifications</Link><Link to="/app/settings" onClick={() => setMoreOpen(false)}><Settings size={16} /> Settings</Link><button className="mobile-more-signout" onClick={handleLogout} disabled={loggingOut}><LogOut size={16} /> {loggingOut ? 'Signing out…' : 'Sign out'}</button>
      </div>}
    </nav>
    <section className="dashboard-main">
      <header className="dashboard-topbar"><span className="breadcrumb">My workspace <span>/</span> {active === 'documents' ? 'Documents' : active === 'chat' ? 'Ask materials' : active === 'notes' ? 'Notes' : active === 'sources' ? 'Website sources' : active === 'quizzes' ? 'Quizzes' : active === 'flashcards' ? 'Flashcards' : active === 'tasks' ? 'Tasks' : active === 'assignments' ? 'Assignments' : active === 'saved' ? 'Saved items' : active === 'notifications' ? 'Notifications' : active === 'settings' ? 'Settings' : 'Overview'}</span><span className="topbar-avatar">{user?.displayName?.slice(0, 1)?.toUpperCase() || 'S'}</span></header>
      <div className="dashboard-content">{children}</div>
    </section>
  </main>;
}
