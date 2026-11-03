import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CalendarClock, CheckCircle2, ClipboardCheck, ClipboardList, FileText, Globe2, GraduationCap, LoaderCircle, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkspaceShell from './WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { documentApi } from '../../services/documentApi.js';
import { sourceApi } from '../../services/sourceApi.js';
import { noteApi } from '../../services/noteApi.js';
import { quizApi } from '../../services/quizApi.js';
import { taskApi } from '../../services/taskApi.js';
import { assignmentApi } from '../../services/assignmentApi.js';

const emptyStats = { documents: 0, websites: 0, notes: 0, quizzes: 0, tasks: 0, assignments: 0 };
const dateLabel = value => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export default function DashboardPage() {
  const { user, accessToken, refreshAccessToken } = useAuth();
  const auth = useMemo(() => ({ token: accessToken, refreshAccessToken }), [accessToken, refreshAccessToken]);
  const [stats, setStats] = useState(emptyStats);
  const [deadlines, setDeadlines] = useState([]);
  const [deadlinesUnavailable, setDeadlinesUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const roleLabels = { student: 'Student', teacher: 'Teacher / educator', employee: 'Employee', business: 'Business professional' };

  useEffect(() => {
    let active = true;
    async function loadOverview() {
      setLoading(true); setError('');
      const results = await Promise.allSettled([
        documentApi.list(auth), sourceApi.list(auth), noteApi.list('', auth), quizApi.list(auth), taskApi.list(auth), assignmentApi.list(auth),
      ]);
      if (!active) return;
      const [documents, websites, notes, quizzes, tasks, assignments] = results;
      const values = results.map(result => result.status === 'fulfilled' ? result.value : null);
      if (values.every(value => value === null)) {
        setError('Your workspace summary could not be loaded. Check your connection and try again.');
      } else {
        setStats({
          documents: documents.status === 'fulfilled' ? documents.value.total : null,
          websites: websites.status === 'fulfilled' ? websites.value.items.length : null,
          notes: notes.status === 'fulfilled' ? notes.value.length : null,
          quizzes: quizzes.status === 'fulfilled' ? quizzes.value.items.length : null,
          tasks: tasks.status === 'fulfilled' ? tasks.value.filter(item => item.status !== 'done').length : null,
          assignments: assignments.status === 'fulfilled' ? assignments.value.filter(item => item.status !== 'submitted').length : null,
        });
        const upcoming = [
          ...(tasks.status === 'fulfilled' ? tasks.value.filter(item => item.status !== 'done' && item.dueAt).map(item => ({ ...item, type: 'Task', href: '/app/tasks' })) : []),
          ...(assignments.status === 'fulfilled' ? assignments.value.filter(item => item.status !== 'submitted' && item.dueAt).map(item => ({ ...item, type: 'Assignment', href: '/app/assignments' })) : []),
        ].filter(item => new Date(item.dueAt) < new Date(Date.now() + 30 * 86400000)).sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)).slice(0, 4);
        setDeadlines(upcoming);
        setDeadlinesUnavailable(tasks.status === 'rejected' || assignments.status === 'rejected');
        if (results.some(result => result.status === 'rejected')) setError('Some workspace counts are unavailable right now.');
      }
      setLoading(false);
    }
    loadOverview();
    return () => { active = false; };
  }, [auth]);

  const cards = [
    { label: 'Documents', value: stats.documents, icon: FileText, tone: 'blue', href: '/app/documents' },
    { label: 'Web sources', value: stats.websites, icon: Globe2, tone: 'violet', href: '/app/sources' },
    { label: 'Study notes', value: stats.notes, icon: BookOpen, tone: 'gold', href: '/app/notes' },
    { label: 'Quizzes', value: stats.quizzes, icon: ClipboardCheck, tone: 'green', href: '/app/quizzes' },
    { label: 'Open tasks', value: stats.tasks, icon: ClipboardList, tone: 'blue', href: '/app/tasks' },
    { label: 'Open assignments', value: stats.assignments, icon: CalendarClock, tone: 'rose', href: '/app/assignments' },
  ];

  return <WorkspaceShell active="overview">
    <div className="welcome-banner"><div><p className="eyebrow"><Sparkles size={14} /> YOUR STUDYRAG WORKSPACE</p><h1>Welcome back, {user?.displayName?.split(' ')[0]}.</h1><p>Your study materials and next steps, all in one place.</p></div><div className="welcome-illustration"><div className="welcome-orbit" /><span><GraduationCap size={38} /></span><i><Sparkles size={15} /></i></div></div>
    <div className="dashboard-section-heading"><div><h2>Workspace overview</h2><p>{loading ? 'Gathering your latest study activity…' : `Your account is set up as ${roleLabels[user?.role] || 'Member'}.`}</p></div><Link className="dashboard-text-link" to="/app/settings">Account settings <ArrowRight size={14} /></Link></div>
    {error && <p className="dashboard-load-message" role="status">{error}</p>}
    <div className="dashboard-stats-grid">{cards.map(({ label, value, icon: Icon, tone, href }) => <Link key={label} className="dashboard-stat-card" to={href}><span className={`dashboard-stat-icon ${tone}`}><Icon size={17} /></span><span className="dashboard-stat-value">{loading ? <LoaderCircle size={17} className="spin" /> : value ?? '—'}</span><span className="dashboard-stat-label">{label}</span></Link>)}</div>
    <div className="dashboard-lower-grid"><section className="dashboard-panel"><div className="dashboard-panel-heading"><span><CalendarClock size={16} /></span><div><h2>Upcoming deadlines</h2><p>Due dates from your tasks and assignments</p></div></div>
      {loading ? <p className="dashboard-panel-empty">Loading your deadlines…</p> : deadlines.length ? <div className="dashboard-deadlines">{deadlines.map(item => { const overdue = new Date(item.dueAt) < new Date(); return <Link to={item.href} className="dashboard-deadline" key={`${item.type}-${item.id}`}><span className={`deadline-dot ${overdue ? 'overdue' : ''}`} /><span className="deadline-copy"><b>{item.title}</b><small>{item.type}</small></span><time className={overdue ? 'overdue' : ''}>{overdue ? 'Overdue · ' : ''}{dateLabel(item.dueAt)}</time></Link>; })}</div> : <div className="dashboard-panel-empty">{deadlinesUnavailable ? <><span>Could not load all deadlines.</span><Link to="/app/tasks">View tasks <ArrowRight size={13} /></Link></> : <><CheckCircle2 size={19} /><span>No upcoming deadlines. You’re all caught up.</span><Link to="/app/tasks">Plan a task <ArrowRight size={13} /></Link></>}</div>}
    </section><section className="dashboard-panel dashboard-quick-panel"><div className="dashboard-panel-heading"><span><Sparkles size={16} /></span><div><h2>Continue learning</h2><p>Jump into a study activity</p></div></div><Link className="dashboard-quick-link" to="/app/chat"><MessageCircle size={16} /><span><b>Ask your materials</b><small>Get cited answers from your sources</small></span><ArrowRight size={14} /></Link><Link className="dashboard-quick-link" to="/app/documents"><FileText size={16} /><span><b>Add study materials</b><small>Upload PDFs, DOCX, or text files</small></span><ArrowRight size={14} /></Link></section></div>
    <p className="dashboard-footnote"><ShieldCheck size={15} /> Your workspace data is private to your account.</p>
  </WorkspaceShell>;
}
