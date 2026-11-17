import { useCallback, useEffect, useState } from 'react';
import { Activity, BookOpen, ClipboardCheck, FileText, Globe2, Layers3, LoaderCircle, Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { adminApi } from '../../services/adminApi.js';

const metrics = [
  ['users', 'Registered users', Users], ['activeSessions', 'Active sessions', Activity], ['documents', 'Documents', FileText], ['notes', 'Notes', BookOpen],
  ['websites', 'Web sources', Globe2], ['quizzes', 'Quizzes', Layers3], ['assignments', 'Assignments', ClipboardCheck], ['flashcardDecks', 'Flashcard decks', BookOpen],
];
const dateTime = value => value ? new Date(value).toLocaleString() : 'Never';

export default function AdminPage() {
  const { accessToken, refreshAccessToken } = useAuth();
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await adminApi.overview({ token: accessToken, refreshAccessToken, query, page })); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, [accessToken, refreshAccessToken, query, page]);
  useEffect(() => { const timer = window.setTimeout(load, 180); return () => window.clearTimeout(timer); }, [load]);

  return <WorkspaceShell active="admin"><div className="admin-page">
    <div className="documents-heading admin-heading"><div><p className="eyebrow"><Activity size={14} /> OWNER DASHBOARD</p><h1>Admin panel</h1></div><span className="admin-private-badge">Private admin access</span></div>
    {error && <p className="note-feedback error" role="alert">{error}</p>}
    {loading && !data ? <div className="notes-list-state"><LoaderCircle size={16} className="spin" /> Loading workspace analytics…</div> : <>
      <section className="admin-metrics" aria-label="Workspace totals">{metrics.map(([key, label, Icon]) => <article className="admin-metric" key={key}><span><Icon size={19} /></span><div><strong>{data?.stats[key] ?? 0}</strong><small>{label}</small></div></article>)}</section>
      <section className="admin-system-status"><strong>Deployment health</strong><span className={data?.system.database === 'connected' ? 'healthy' : 'unhealthy'}>Database · {data?.system.database || 'unknown'}</span><span className={data?.system.fileStorage === 's3' ? 'healthy' : 'unhealthy'}>File storage · {data?.system.fileStorage || 'unknown'}</span></section>
      <section className="admin-card"><header className="admin-card-heading"><div><h2>Users</h2><p>Account details and last sign-in time</p></div><label className="admin-search"><Search size={16} /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Search users" /></label></header>
        {loading ? <div className="notes-list-state"><LoaderCircle size={16} className="spin" /> Updating…</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Last sign-in</th></tr></thead><tbody>{data?.users.map(user => <tr key={user.id}><td><strong>{user.displayName}</strong><small>{user.email}</small></td><td>{user.role}</td><td><span className={`admin-status ${user.status}`}>{user.status}</span></td><td>{dateTime(user.joinedAt)}</td><td>{dateTime(user.lastLoginAt)}</td></tr>)}</tbody></table>{!data?.users.length && <p className="admin-empty">No matching accounts.</p>}<div className="admin-pagination"><span>{data?.pagination.total || 0} accounts · page {data?.pagination.page || 1} of {Math.max(1, data?.pagination.pages || 1)}</span><button disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))} aria-label="Previous users"><ChevronLeft size={16} /></button><button disabled={page >= (data?.pagination.pages || 1)} onClick={() => setPage(value => value + 1)} aria-label="Next users"><ChevronRight size={16} /></button></div></div>}
      </section>
      <section className="admin-card"><header className="admin-card-heading"><div><h2>Recent activity</h2><p>Sign-ins and successful workspace changes</p></div></header><div className="admin-signins">{[...(data?.recentActions || []).map(item => ({ ...item, kind: 'action', timestamp: item.happenedAt })), ...(data?.recentSignIns || []).map(item => ({ ...item, kind: 'login', timestamp: item.signedInAt }))].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20).map(item => <article key={`${item.kind}-${item.id}`}><span className="admin-user-dot">{item.user.name?.slice(0, 1)?.toUpperCase() || 'U'}</span><div><strong>{item.user.name}</strong><small>{item.user.email} · {item.kind === 'login' ? 'signed in' : item.action}</small></div><time>{dateTime(item.timestamp)}</time></article>)}</div></section>
      <p className="admin-privacy-note">Private user content is excluded. Activity records only sign-ins and broad action types; it never stores message text, note content, or filenames.</p>
    </>}
  </div></WorkspaceShell>;
}
