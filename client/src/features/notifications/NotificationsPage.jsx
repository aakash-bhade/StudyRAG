import { useCallback, useEffect, useState } from 'react';
import { Bell, CalendarClock, Check, ClipboardCheck, ClipboardList, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { notificationApi } from '../../services/notificationApi.js';

export default function NotificationsPage() {
  const { accessToken, refreshAccessToken } = useAuth();
  const auth = { token: accessToken, refreshAccessToken };
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await notificationApi.list(auth); setItems(result.items); setUnreadCount(result.unreadCount); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [accessToken, refreshAccessToken]);
  useEffect(() => { load(); }, [load]);
  async function markRead(item) {
    try { const saved = await notificationApi.markRead(item.id, auth); setItems(current => current.map(row => row.id === saved.id ? saved : row)); setUnreadCount(count => Math.max(0, count - (item.readAt ? 0 : 1))); }
    catch (e) { setError(e.message); }
  }
  return <WorkspaceShell active="notifications"><div className="notifications-page">
    <div className="documents-heading"><div><p className="eyebrow"><Bell size={13} /> DEADLINE REMINDERS</p><h1>Notifications</h1><p>In-app reminders for overdue work and deadlines in the next 7 days.</p></div><span className="documents-count"><Bell size={14} /> {unreadCount} unread</span></div>
    {error && <p className="note-feedback error" role="alert">{error}</p>}
    {loading ? <div className="notes-list-state"><LoaderCircle size={15} className="spin" /> Checking your deadlines…</div> : items.length ? <div className="notification-list">{items.map(item => <article className={`notification-card ${item.readAt ? 'read' : 'unread'}`} key={item.id}><span className="notification-icon">{item.type === 'task' ? <ClipboardList size={17} /> : <ClipboardCheck size={17} />}</span><div className="notification-copy"><span className="notification-kind">{item.type === 'task' ? 'Task deadline' : 'Assignment deadline'}</span><h2>{item.title}</h2><p>{item.body} Due {new Date(item.dueAt).toLocaleString()}.</p><Link to={item.href}>Open {item.type === 'task' ? 'tasks' : 'assignments'} →</Link></div>{!item.readAt && <button className="notification-read-button" onClick={() => markRead(item)} aria-label={`Mark ${item.title} as read`}><Check size={16} /> Mark read</button>}</article>)}</div> : <div className="notification-empty"><CalendarClock size={25} /><h2>All caught up</h2><p>No overdue or upcoming tasks and assignments within the next 7 days.</p><Link to="/app/tasks">Review your study plan →</Link></div>}
    <p className="notification-footnote">Reminders refresh when you open this page. Email and push notifications are not enabled.</p>
  </div></WorkspaceShell>;
}
