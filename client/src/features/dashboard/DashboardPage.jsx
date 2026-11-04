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
const roleViews = {
  student: {
    overview: 'Your study materials, personal notes, and next steps.',
    activityTitle: 'Continue learning',
    activityDescription: 'Pick up where you left off with your own materials.',
    chatTitle: 'Ask your study materials',
    chatDescription: 'Get cited answers from your sources',
    documentTitle: 'Add study materials',
    documentDescription: 'Upload PDFs, DOCX, or text files',
  },
  teacher: {
    overview: 'Your teaching materials, preparation notes, and upcoming work.',
    activityTitle: 'Prepare a lesson',
    activityDescription: 'Use your own teaching materials and notes.',
    chatTitle: 'Ask your teaching materials',
    chatDescription: 'Find cited details in your resources',
    documentTitle: 'Add teaching resources',
    documentDescription: 'Upload lesson plans, PDFs, or text files',
  },
  employee: {
    overview: 'Your work documents, professional notes, and upcoming tasks.',
    activityTitle: 'Continue your work',
    activityDescription: 'Search the documents in your personal workspace.',
    chatTitle: 'Search your work documents',
    chatDescription: 'Get cited answers from your own sources',
    documentTitle: 'Add work documents',
    documentDescription: 'Upload reports, PDFs, DOCX, or text files',
  },
  business: {
    overview: 'Your business materials, planning notes, and upcoming work.',
    activityTitle: 'Review your materials',
    activityDescription: 'Use your own business documents and notes.',
    chatTitle: 'Search your business materials',
    chatDescription: 'Get cited answers from your own sources',
    documentTitle: 'Add business documents',
    documentDescription: 'Upload reports, PDFs, DOCX, or text files',
  },
};

export default function DashboardPage() {
  const { user, accessToken, refreshAccessToken } = useAuth();
  const auth = useMemo(() => ({ token: accessToken, refreshAccessToken }), [accessToken, refreshAccessToken]);
  const [stats, setStats] = useState(emptyStats);
  const [deadlines, setDeadlines] = useState([]);
  const [deadlinesUnavailable, setDeadlinesUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const roleLabels = { student: 'Student', teacher: 'Teacher / educator', employee: 'Employee', business: 'Business professional' };
  const roleView = roleViews[user?.role] || roleViews.student;
  const needsFirstMaterial = !loading && stats.documents === 0 && stats.websites === 0 && stats.notes === 0;

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
    <div className="welcome-banner"><div><p className="eyebrow"><Sparkles size={14} /> {roleLabels[user?.role]?.toUpperCase() || 'YOUR'} STUDYRAG WORKSPACE</p><h1>Welcome back, {user?.displayName?.split(' ')[0]}.</h1><p>{roleView.overview}</p></div><div className="welcome-illustration"><div className="welcome-orbit" /><span><GraduationCap size={38} /></span><i><Sparkles size={15} /></i></div></div>
    {needsFirstMaterial && <section className="dashboard-onboarding" aria-labelledby="onboarding-title"><div className="onboarding-copy"><span className="onboarding-step">START HERE · 2 SIMPLE STEPS</span><h2 id="onboarding-title">Let’s make your workspace useful</h2><p>Add one study material first. Then ask a question and get an answer based on what you added.</p><div className="onboarding-actions"><Link to="/app/documents"><FileText size={17} /> Add a document <ArrowRight size={15} /></Link><Link to="/app/sources"><Globe2 size={17} /> Add a website</Link><Link to="/app/notes"><BookOpen size={17} /> Write a note</Link></div></div><div className="onboarding-next"><span>THEN</span><MessageCircle size={20} /><b>Ask your materials</b><small>Find Ask in the left menu when you’re ready.</small></div></section>}
    <div className="dashboard-section-heading"><div><h2>Workspace overview</h2><p>{loading ? 'Gathering your latest activity…' : `Personal workspace · ${roleLabels[user?.role] || 'Member'}`}</p></div><Link className="dashboard-text-link" to="/app/settings">Account settings <ArrowRight size={14} /></Link></div>
    {error && <p className="dashboard-load-message" role="status">{error}</p>}
    <div className="dashboard-stats-grid">{cards.map(({ label, value, icon: Icon, tone, href }) => <Link key={label} className="dashboard-stat-card" to={href}><span className={`dashboard-stat-icon ${tone}`}><Icon size={17} /></span><span className="dashboard-stat-value">{loading ? <LoaderCircle size={17} className="spin" /> : value ?? '—'}</span><span className="dashboard-stat-label">{label}</span></Link>)}</div>
    <div className="dashboard-lower-grid"><section className="dashboard-panel"><div className="dashboard-panel-heading"><span><CalendarClock size={16} /></span><div><h2>Upcoming deadlines</h2><p>Your task and assignment due dates</p></div></div>
      {loading ? <p className="dashboard-panel-empty">Loading your deadlines…</p> : deadlines.length ? <div className="dashboard-deadlines">{deadlines.map(item => { const overdue = new Date(item.dueAt) < new Date(); return <Link to={item.href} className="dashboard-deadline" key={`${item.type}-${item.id}`}><span className={`deadline-dot ${overdue ? 'overdue' : ''}`} /><span className="deadline-copy"><b>{item.title}</b><small>{item.type}</small></span><time className={overdue ? 'overdue' : ''}>{overdue ? 'Overdue · ' : ''}{dateLabel(item.dueAt)}</time></Link>; })}</div> : <div className="dashboard-panel-empty">{deadlinesUnavailable ? <><span>Could not load all deadlines.</span><Link to="/app/tasks">View tasks <ArrowRight size={13} /></Link></> : <><CheckCircle2 size={19} /><span>No upcoming deadlines. You’re all caught up.</span><Link to="/app/tasks">Plan a task <ArrowRight size={13} /></Link></>}</div>}
    </section><section className="dashboard-panel dashboard-quick-panel"><div className="dashboard-panel-heading"><span><Sparkles size={16} /></span><div><h2>{roleView.activityTitle}</h2><p>{roleView.activityDescription}</p></div></div><Link className="dashboard-quick-link" to="/app/chat"><MessageCircle size={16} /><span><b>{roleView.chatTitle}</b><small>{roleView.chatDescription}</small></span><ArrowRight size={14} /></Link><Link className="dashboard-quick-link" to="/app/documents"><FileText size={16} /><span><b>{roleView.documentTitle}</b><small>{roleView.documentDescription}</small></span><ArrowRight size={14} /></Link></section></div>
    <p className="dashboard-footnote"><ShieldCheck size={15} /> Only you can access the data in this personal workspace.</p>
  </WorkspaceShell>;
}
