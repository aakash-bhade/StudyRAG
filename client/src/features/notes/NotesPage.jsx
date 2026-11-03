import { useCallback, useEffect, useState } from 'react';
import { FileText, LoaderCircle, Plus, Save, Search, ShieldCheck, Trash2 } from 'lucide-react';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { noteApi } from '../../services/noteApi.js';

const emptyDraft = () => ({ id: null, title: '', body: '', tags: '' });

export default function NotesPage() {
  const { accessToken, refreshAccessToken } = useAuth();
  const auth = { token: accessToken, refreshAccessToken };
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadNotes = useCallback(async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const result = await noteApi.list(search, auth);
      setNotes(result);
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }, [accessToken, refreshAccessToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadNotes(query), query ? 200 : 0);
    return () => window.clearTimeout(timer);
  }, [query, loadNotes]);

  function newNote() { setDraft(emptyDraft()); setError(''); setNotice(''); }

  async function saveNote(event) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    const payload = { title: draft.title, body: draft.body, tags: draft.tags.split(',').map(tag => tag.trim()).filter(Boolean) };
    try {
      const note = draft.id ? await noteApi.update(draft.id, payload, auth) : await noteApi.create(payload, auth);
      setDraft({ ...note, tags: note.tags.join(', ') });
      setNotes(items => [note, ...items.filter(item => item.id !== note.id)]);
      setNotice('Note saved to your private workspace.');
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  }

  async function deleteNote() {
    if (!draft.id || !window.confirm('Delete this note? This cannot be undone.')) return;
    try {
      await noteApi.remove(draft.id, auth);
      setNotes(items => items.filter(note => note.id !== draft.id));
      setDraft(emptyDraft());
      setNotice('Note deleted.');
      setError('');
    } catch (deleteError) { setError(deleteError.message); }
  }

  return <WorkspaceShell active="notes"><div className="notes-page">
    <div className="documents-heading"><div><p className="eyebrow"><FileText size={13} /> YOUR PRIVATE NOTES</p><h1>Notes</h1><p>Capture and organize what you learn alongside your study materials.</p></div><span className="documents-count"><ShieldCheck size={15} /> Private to you</span></div>
    <div className="notes-workspace">
      <aside className="notes-list-panel"><div className="notes-list-heading"><h2>Your notes <span>{notes.length}</span></h2><button onClick={newNote} aria-label="Create a new note"><Plus size={16} /></button></div><label className="notes-search"><Search size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search notes…" /></label>
        {loading ? <div className="notes-list-state"><LoaderCircle size={15} className="spin" /> Loading notes…</div> : notes.length ? <div className="notes-list">{notes.map(note => <button key={note.id} className={`notes-list-item ${draft.id === note.id ? 'selected' : ''}`} onClick={() => { setDraft({ ...note, tags: note.tags.join(', ') }); setError(''); setNotice(''); }}><b>{note.title}</b><span>{note.body.slice(0, 82) || 'No content yet'}</span><small>{new Date(note.updatedAt).toLocaleDateString()}</small></button>)}</div> : <div className="notes-empty-list"><FileText size={21} /><p>{query ? 'No notes match your search.' : 'Your saved notes will appear here.'}</p><button onClick={newNote}>Create a note</button></div>}
      </aside>
      <form className="note-editor" onSubmit={saveNote}>
        {error && <p className="note-feedback error" role="alert">{error}</p>}{notice && <p className="note-feedback success" role="status">{notice}</p>}
        <div className="note-editor-toolbar"><span>{draft.id ? 'Edit note' : 'New note'}</span><div>{draft.id && <button type="button" className="note-delete-button" onClick={deleteNote} aria-label="Delete note"><Trash2 size={15} /></button>}<button type="submit" className="note-save-button" disabled={saving || !draft.title.trim() || !draft.body.trim()}>{saving ? <LoaderCircle size={14} className="spin" /> : <Save size={14} />}{saving ? 'Saving…' : 'Save note'}</button></div></div>
        <input className="note-title-input" value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} placeholder="Note title" maxLength={120} aria-label="Note title" />
        <input className="note-tags-input" value={draft.tags} onChange={event => setDraft(current => ({ ...current, tags: event.target.value }))} placeholder="Tags, separated by commas" aria-label="Note tags" />
        <textarea className="note-body-input" value={draft.body} onChange={event => setDraft(current => ({ ...current, body: event.target.value }))} placeholder="Write down a concept, question, or insight…" maxLength={10000} aria-label="Note content" />
        <div className="note-editor-footer"><ShieldCheck size={13} /> Saved privately to your account <span>{draft.body.length.toLocaleString()} / 10,000</span></div>
      </form>
    </div>
  </div></WorkspaceShell>;
}
