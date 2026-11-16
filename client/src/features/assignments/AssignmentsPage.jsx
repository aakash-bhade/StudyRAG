import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Check, ClipboardCheck, ClipboardList, LoaderCircle, Plus, Send, Trash2 } from 'lucide-react';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { assignmentApi } from '../../services/assignmentApi.js';

const blank = { title: '', instructions: '', dueAt: '' };
const statusLabel = { assigned: 'Assigned', in_progress: 'In progress', submitted: 'Submitted in StudyRAG' };

export default function AssignmentsPage() {
  const { accessToken, refreshAccessToken } = useAuth();
  const auth = { token: accessToken, refreshAccessToken };
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(blank);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await assignmentApi.list(auth); setItems(result); setResponses(Object.fromEntries(result.map(item => [item.id, item.response || '']))); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [accessToken, refreshAccessToken]);
  useEffect(() => { load(); }, [load]);

  async function create(event) {
    event.preventDefault(); setSaving(true); setError('');
    try { const item = await assignmentApi.create({ ...draft, dueAt: draft.dueAt ? new Date(`${draft.dueAt}T23:59:00`).toISOString() : null }, auth); setItems(current => [item, ...current]); setResponses(current => ({ ...current, [item.id]: '' })); setDraft(blank); }
    catch (e) { setError(e.message); } finally { setSaving(false); }
  }
  async function saveDraft(item) {
    if (item.status === 'submitted') return;
    try { const saved = await assignmentApi.update(item.id, { title: item.title, instructions: item.instructions, dueAt: item.dueAt, status: responses[item.id]?.trim() ? 'in_progress' : 'assigned', response: responses[item.id] || '' }, auth); setItems(current => current.map(row => row.id === saved.id ? saved : row)); }
    catch (e) { setError(e.message); }
  }
  async function submit(item) {
    if (!responses[item.id]?.trim()) { setError('Write your response before marking it submitted.'); return; }
    if (!window.confirm('Mark this as submitted in StudyRAG? This does not submit it to your school or learning platform.')) return;
    try { const saved = await assignmentApi.submit(item.id, responses[item.id], auth); setItems(current => current.map(row => row.id === saved.id ? saved : row)); }
    catch (e) { setError(e.message); }
  }
  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    try { await assignmentApi.remove(item.id, auth); setItems(current => current.filter(row => row.id !== item.id)); }
    catch (e) { setError(e.message); }
  }

  return <WorkspaceShell active="assignments"><div className="assignments-page">
    <div className="documents-heading"><div><p className="eyebrow"><ClipboardCheck size={13} /> YOUR COURSEWORK</p><h1>Assignments</h1><p>Keep instructions, due dates, and response drafts together in your private workspace.</p></div><span className="documents-count"><Check size={15} /> {items.filter(item => item.status === 'submitted').length} marked submitted</span></div>
    {error && <p className="note-feedback error" role="alert">{error}</p>}
    <form className="assignment-create-card" onSubmit={create}><h2><Plus size={17} /> Add assignment</h2><div className="assignment-create-fields"><input required maxLength={160} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Assignment title" aria-label="Assignment title" /><label><CalendarDays size={15} /><input type="date" value={draft.dueAt} onChange={e => setDraft({ ...draft, dueAt: e.target.value })} aria-label="Due date" /></label><textarea required value={draft.instructions} onChange={e => setDraft({ ...draft, instructions: e.target.value })} placeholder="Paste assignment instructions…" aria-label="Assignment instructions" /><button disabled={saving || !draft.title.trim() || !draft.instructions.trim()}>{saving ? <LoaderCircle size={15} className="spin" /> : <Plus size={15} />} Add assignment</button></div></form>
    {loading ? <div className="notes-list-state"><LoaderCircle size={15} className="spin" /> Loading assignments…</div> : items.length ? <div className="assignment-list">{items.map(item => <article className="assignment-card" key={item.id}><header><div><span className={`assignment-status ${item.status}`}>{statusLabel[item.status]}</span><h2>{item.title}</h2></div><button className="task-remove" onClick={() => remove(item)} aria-label={`Delete ${item.title}`}><Trash2 size={15} /></button></header><p className="assignment-instructions">{item.instructions}</p>{item.dueAt && <small className="assignment-due"><CalendarDays size={13} /> Due {new Date(item.dueAt).toLocaleDateString()}</small>}<label className="assignment-response-label">Your response draft<textarea disabled={item.status === 'submitted'} maxLength={10000} value={responses[item.id] ?? item.response} onChange={e => setResponses(current => ({ ...current, [item.id]: e.target.value }))} placeholder="Draft your response here…" aria-label={`Response draft for ${item.title}`} /></label><footer><span>{item.status === 'submitted' && item.submittedAt ? `Marked submitted ${new Date(item.submittedAt).toLocaleDateString()} in StudyRAG` : 'Private draft · not sent to your school'}</span><div><button className="assignment-save" disabled={item.status === 'submitted'} onClick={() => saveDraft(item)}>Save draft</button><button className="assignment-submit" onClick={() => submit(item)} disabled={item.status === 'submitted'}><Send size={13} />{item.status === 'submitted' ? 'Marked submitted' : 'Mark submitted'}</button></div></footer></article>)}</div> : <div className="assignment-empty"><ClipboardList size={24} /><h2>No assignments yet</h2></div>}
  </div></WorkspaceShell>;
}
