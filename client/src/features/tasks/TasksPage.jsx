import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Check, Circle, ClipboardList, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { taskApi } from '../../services/taskApi.js';

const blank = { title: '', details: '', dueAt: '' };
const label = { todo: 'To do', in_progress: 'In progress', done: 'Done' };

export default function TasksPage() {
  const { accessToken, refreshAccessToken } = useAuth();
  const auth = { token: accessToken, refreshAccessToken };
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setTasks(await taskApi.list(auth)); } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [accessToken, refreshAccessToken]);
  useEffect(() => { load(); }, [load]);

  async function create(event) {
    event.preventDefault(); setSaving(true); setError('');
    try { const task = await taskApi.create({ ...draft, dueAt: draft.dueAt ? new Date(`${draft.dueAt}T23:59:00`).toISOString() : null }, auth); setTasks(items => [task, ...items]); setDraft(blank); }
    catch (e) { setError(e.message); } finally { setSaving(false); }
  }
  async function update(task, changes) {
    try { const saved = await taskApi.update(task.id, { title: task.title, details: task.details, dueAt: task.dueAt, status: task.status, ...changes }, auth); setTasks(items => items.map(item => item.id === saved.id ? saved : item)); }
    catch (e) { setError(e.message); }
  }
  async function remove(task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    try { await taskApi.remove(task.id, auth); setTasks(items => items.filter(item => item.id !== task.id)); }
    catch (e) { setError(e.message); }
  }
  const groups = ['todo', 'in_progress', 'done'];
  return <WorkspaceShell active="tasks"><div className="tasks-page">
    <div className="documents-heading"><div><p className="eyebrow"><ClipboardList size={13} /> YOUR STUDY PLAN</p><h1>Tasks</h1><p>Keep assignments and study goals organized in one private checklist.</p></div><span className="documents-count"><Check size={15} /> {tasks.filter(t => t.status === 'done').length} completed</span></div>
    {error && <p className="note-feedback error" role="alert">{error}</p>}
    <form className="task-create-card" onSubmit={create}><h2><Plus size={17} /> Add a task</h2><div className="task-fields"><input required maxLength={160} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Review chapter 4" aria-label="Task title" /><input maxLength={2000} value={draft.details} onChange={e => setDraft({ ...draft, details: e.target.value })} placeholder="Details (optional)" aria-label="Task details" /><label><CalendarDays size={15} /><input type="date" value={draft.dueAt} onChange={e => setDraft({ ...draft, dueAt: e.target.value })} aria-label="Due date" /></label><button disabled={saving || !draft.title.trim()}>{saving ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />} Add</button></div></form>
    {loading ? <div className="notes-list-state"><LoaderCircle size={15} className="spin" /> Loading tasks…</div> : <div className="task-columns">{groups.map(status => { const items = tasks.filter(task => task.status === status); return <section className="task-column" key={status}><header><h2>{label[status]}</h2><span>{items.length}</span></header>{items.length ? items.map(task => <article className={`task-card ${status === 'done' ? 'completed' : ''}`} key={task.id}><button className="task-toggle" onClick={() => update(task, { status: status === 'done' ? 'todo' : status === 'todo' ? 'in_progress' : 'done' })} aria-label={`Change status for ${task.title}`}>{status === 'done' ? <Check size={16} /> : <Circle size={16} />}</button><div className="task-card-copy"><b>{task.title}</b>{task.details && <p>{task.details}</p>}{task.dueAt && <small><CalendarDays size={12} /> Due {new Date(task.dueAt).toLocaleDateString()}</small>}</div><button className="task-remove" onClick={() => remove(task)} aria-label={`Delete ${task.title}`}><Trash2 size={14} /></button></article>) : <p className="task-empty">No tasks here yet.</p>}</section>; })}</div>}
  </div></WorkspaceShell>;
}
