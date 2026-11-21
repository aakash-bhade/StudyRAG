import { Bell, BookOpen, CalendarDays, ClipboardCheck, FileText, GraduationCap, Layers2, LogOut, MessageCircle, Moon, Search, Settings, ShieldCheck, Sparkles, Sun, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

const roleLabels = { student: 'Student', teacher: 'Teacher / educator', employee: 'Employee', business: 'Business professional', admin: 'Administrator' };
const workspacePages = [
  { label: 'Overview', path: '/app', keywords: 'home dashboard workspace' },
  { label: 'AI Chatbot', path: '/app/chat', keywords: 'ask chat materials assistant' },
  { label: 'My Notes', path: '/app/notes', keywords: 'notes study writing' },
  { label: 'Documents', path: '/app/documents', keywords: 'pdf files upload' },
  { label: 'Websites', path: '/app/sources', keywords: 'web sources links' },
  { label: 'Assignments', path: '/app/assignments', keywords: 'assignment work' },
  { label: 'MCQ Generator', path: '/app/quizzes', keywords: 'quiz mcq questions practice' },
  { label: 'Study Planner', path: '/app/tasks', keywords: 'tasks plan calendar' },
  { label: 'Flashcards', path: '/app/flashcards', keywords: 'cards revision recall' },
  { label: 'Saved items', path: '/app/saved', keywords: 'bookmarks saved' },
  { label: 'Notifications', path: '/app/notifications', keywords: 'alerts updates' },
  { label: 'Settings', path: '/app/settings', keywords: 'profile account preferences' },
  { label: 'Admin panel', path: '/app/admin', keywords: 'users activity admin owner' },
];

export default function WorkspaceShell({ active, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return window.localStorage.getItem('studyrag:theme') === 'dark' ? 'dark' : 'light'; }
    catch { return 'light'; }
  });
  const searchResults = searchQuery.trim() ? workspacePages.filter(item => (item.path !== '/app/admin' || user?.role === 'admin') && `${item.label} ${item.keywords}`.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 5) : [];

  function toggleTheme() {
    setTheme(current => current === 'dark' ? 'light' : 'dark');
  }

  function submitWorkspaceSearch(event) {
    event.preventDefault();
    if (!searchResults.length) return;
    navigate(searchResults[0].path);
    setSearchQuery('');
    setSearchOpen(false);
  }

  function goToSearchResult(path) {
    navigate(path);
    setSearchQuery('');
    setSearchOpen(false);
  }

  useEffect(() => {
    const key = user?.email ? `studyrag:profile-image:${user.email.toLowerCase()}` : '';
    const syncProfileImage = () => setProfileImage(key ? window.localStorage.getItem(key) || '' : '');
    syncProfileImage();
    window.addEventListener('studyrag:profile-image-updated', syncProfileImage);
    return () => window.removeEventListener('studyrag:profile-image-updated', syncProfileImage);
  }, [user?.email]);

  useEffect(() => {
    try { window.localStorage.setItem('studyrag:theme', theme); } catch { /* Theme still works for this session. */ }
    document.documentElement.dataset.workspaceTheme = theme;
    return () => {
      if (document.documentElement.dataset.workspaceTheme === theme) delete document.documentElement.dataset.workspaceTheme;
    };
  }, [theme]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await logout(); } finally { window.location.assign('/'); }
  }

  return <main className="dashboard-shell" data-theme={theme}>
    <aside className="dashboard-sidebar">
      <Link className="auth-brand dashboard-brand" to="/" aria-label="StudyRAG home"><span><GraduationCap size={26} /></span><b>Study<span>RAG</span></b></Link>
      <nav className="desktop-workspace-nav" aria-label="Workspace navigation">
        <Link className={`dash-nav ${active === 'chat' ? 'active' : ''}`} to="/app/chat"><MessageCircle size={17} /> AI Chatbot</Link>
        <Link className={`dash-nav ${active === 'notes' ? 'active' : ''}`} to="/app/notes"><BookOpen size={17} /> My Notes</Link>
        <Link className={`dash-nav ${active === 'documents' ? 'active' : ''}`} to="/app/documents"><FileText size={17} /> Documents</Link>
        <Link className={`dash-nav ${active === 'assignments' ? 'active' : ''}`} to="/app/assignments"><ClipboardCheck size={17} /> Assignments</Link>
        <Link className={`dash-nav ${active === 'quizzes' ? 'active' : ''}`} to="/app/quizzes"><Sparkles size={17} /> MCQ Generator</Link>
        <Link className={`dash-nav ${active === 'tasks' ? 'active' : ''}`} to="/app/tasks"><CalendarDays size={17} /> Study Planner</Link>
        <Link className={`dash-nav ${active === 'settings' ? 'active' : ''}`} to="/app/settings"><Settings size={17} /> Settings</Link>
        {user?.role === 'admin' && <Link className={`dash-nav ${active === 'admin' ? 'active' : ''}`} to="/app/admin"><ShieldCheck size={17} /> Admin panel</Link>}
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-user"><span className="user-avatar">{profileImage ? <img src={profileImage} alt="" /> : user?.displayName?.slice(0, 1)?.toUpperCase() || <UserRound size={17} />}</span><span><b>{user?.displayName}</b><small>{roleLabels[user?.role] || 'Member'}</small></span></div><button className="sign-out-button" onClick={handleLogout} disabled={loggingOut}><LogOut size={16} /> {loggingOut ? 'Signing out…' : 'Sign out'}</button></div>
    </aside>
    <nav className="mobile-bottom-nav" aria-label="Mobile workspace navigation">
      <Link className={active === 'overview' ? 'active' : ''} to="/app"><MessageCircle size={18} /><span>Home</span></Link>
      <Link className={active === 'chat' ? 'active' : ''} to="/app/chat"><Sparkles size={18} /><span>Ask</span></Link>
      <Link className={active === 'documents' ? 'active' : ''} to="/app/documents"><FileText size={18} /><span>Docs</span></Link>
      <Link className={active === 'notes' ? 'active' : ''} to="/app/notes"><BookOpen size={18} /><span>Notes</span></Link>
      <button className={moreOpen || ['quizzes', 'tasks', 'assignments', 'settings', 'admin'].includes(active) ? 'active' : ''} onClick={() => setMoreOpen(value => !value)} aria-expanded={moreOpen}><Layers2 size={18} /><span>More</span></button>
      {moreOpen && <div className="mobile-more-menu"><div className="mobile-more-user"><span className="user-avatar"><UserRound size={16} /></span><span><b>{user?.displayName}</b><small>{roleLabels[user?.role] || 'Member'}</small></span></div>
        <button className="theme-menu-toggle" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} Switch to {theme === 'dark' ? 'light' : 'dark'} mode</button><Link to="/app/assignments" onClick={() => setMoreOpen(false)}><ClipboardCheck size={16} /> Assignments</Link><Link to="/app/quizzes" onClick={() => setMoreOpen(false)}><Sparkles size={16} /> MCQ Generator</Link><Link to="/app/tasks" onClick={() => setMoreOpen(false)}><CalendarDays size={16} /> Study Planner</Link>{user?.role === 'admin' && <Link to="/app/admin" onClick={() => setMoreOpen(false)}><ShieldCheck size={16} /> Admin panel</Link>}<Link to="/app/settings" onClick={() => setMoreOpen(false)}><Settings size={16} /> Settings</Link><button className="mobile-more-signout" onClick={handleLogout} disabled={loggingOut}><LogOut size={16} /> {loggingOut ? 'Signing out…' : 'Sign out'}</button>
      </div>}
    </nav>
    <section className="dashboard-main">
      <header className="dashboard-topbar">
        <span className="breadcrumb">My workspace <span>/</span> {active === 'admin' ? 'Admin panel' : active === 'documents' ? 'Documents' : active === 'chat' ? 'AI Chatbot' : active === 'notes' ? 'My Notes' : active === 'sources' ? 'Websites' : active === 'quizzes' ? 'MCQ Generator' : active === 'flashcards' ? 'Flashcards' : active === 'tasks' ? 'Study Planner' : active === 'assignments' ? 'Assignments' : active === 'saved' ? 'Saved items' : active === 'notifications' ? 'Notifications' : active === 'settings' ? 'Settings' : 'Overview'}</span>
        <div className="workspace-search-wrap">
          <form className="workspace-search" role="search" onSubmit={submitWorkspaceSearch}>
            <Search size={16} aria-hidden="true" />
            <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} onFocus={() => setSearchOpen(true)} onKeyDown={event => { if (event.key === 'Escape') setSearchOpen(false); }} placeholder="Search anything…" aria-label="Search workspace pages and tools" aria-expanded={searchOpen && Boolean(searchQuery.trim())} aria-controls="workspace-search-results" />
          </form>
          {searchOpen && searchQuery.trim() && <div className="workspace-search-results" id="workspace-search-results" role="listbox" aria-label="Matching pages">{searchResults.length ? searchResults.map(item => <button key={item.path} type="button" role="option" onClick={() => goToSearchResult(item.path)}><Search size={14} /><span>{item.label}</span><small>Open</small></button>) : <p>No matching pages or tools.</p>}</div>}
        </div>
        <div className="dashboard-topbar-actions"><button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'dark'} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button><Link className={`topbar-notifications ${active === 'notifications' ? 'active' : ''}`} to="/app/notifications" aria-label="Notifications" title="Notifications"><Bell size={17} /></Link><Link className="topbar-avatar" to="/app/settings" aria-label="Open your profile" title="Your profile">{profileImage ? <img src={profileImage} alt="" /> : user?.displayName?.slice(0, 1)?.toUpperCase() || 'S'}</Link></div>
      </header>
      <div className="dashboard-content">{children}</div>
    </section>
  </main>;
}
