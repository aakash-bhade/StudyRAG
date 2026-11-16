import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bold, BookOpen, Code2, FileText, Folder, Heading2, Italic, List, ListOrdered, LoaderCircle, Pencil, Plus, Quote, Save, Search, ShieldCheck, Trash2, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { noteApi } from '../../services/noteApi.js';
import { folderApi } from '../../services/folderApi.js';

const emptyDraft = (folderId = null) => ({ id: null, title: '', body: '', tags: '', folderId });
const asDraft = note => ({ ...note, body: note.body || '', folderId: note.folderId || null, tags: Array.isArray(note.tags) ? note.tags.join(', ') : '' });

export default function NotesPage() {
  const { accessToken, refreshAccessToken } = useAuth();
  const auth = { token: accessToken, refreshAccessToken };
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [draft, setDraft] = useState(emptyDraft());
  const [activeFolder, setActiveFolder] = useState('all');
  const [newFolderName, setNewFolderName] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const notesRequestId = useRef(0);
  const bodyInputRef = useRef(null);

  const loadNotes = useCallback(async (search = '') => {
    const requestId = ++notesRequestId.current;
    setLoading(true);
    setError('');
    try {
      const result = await noteApi.list(search, auth);
      if (requestId === notesRequestId.current) setNotes(result);
    } catch (loadError) { if (requestId === notesRequestId.current) setError(loadError.message); }
    finally { if (requestId === notesRequestId.current) setLoading(false); }
  }, [accessToken, refreshAccessToken]);

  const loadFolders = useCallback(async () => {
    try { setFolders(await folderApi.list(auth)); } catch (loadError) { setError(loadError.message); }
  }, [accessToken, refreshAccessToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadNotes(query), query ? 200 : 0);
    return () => window.clearTimeout(timer);
  }, [query, loadNotes]);
  useEffect(() => { loadFolders(); }, [loadFolders]);
  useEffect(() => {
    if (!editorOpen) return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [editorOpen]);

  function newNote() { setDraft(emptyDraft(activeFolder !== 'all' && activeFolder !== 'unfiled' ? activeFolder : null)); setError(''); setNotice(''); setEditorOpen(true); }

  function formatBody(mode) {
    const input = bodyInputRef.current;
    if (!input) return;
    const value = draft.body;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const blockPrefixes = { heading: '## ', bullets: '- ', numbers: '1. ', quote: '> ', code: '    ' };
    let nextValue;
    let selectionStart;
    let selectionEnd;

    if (blockPrefixes[mode]) {
      const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      let lineEnd = value.indexOf('\n', end);
      if (lineEnd < 0) lineEnd = value.length;
      const selectedLines = value.slice(lineStart, lineEnd).split('\n');
      const prefix = blockPrefixes[mode];
      const formattedLines = selectedLines.map((line, index) => `${mode === 'numbers' ? `${index + 1}. ` : prefix}${line}`);
      const formattedText = formattedLines.join('\n');
      nextValue = `${value.slice(0, lineStart)}${formattedText}${value.slice(lineEnd)}`;
      selectionStart = lineStart;
      selectionEnd = lineStart + formattedText.length;
    } else {
      const marker = mode === 'bold' ? '**' : mode === 'italic' ? '*' : '`';
      const selectedText = value.slice(start, end);
      const wrappedText = `${marker}${selectedText || 'text'}${marker}`;
      nextValue = `${value.slice(0, start)}${wrappedText}${value.slice(end)}`;
      selectionStart = selectedText ? start : start + marker.length;
      selectionEnd = selectedText ? start + wrappedText.length : selectionStart + 4;
    }

    setDraft(current => ({ ...current, body: nextValue }));
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  function handleBodyKeyDown(event) {
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    if (key === 'b' || key === 'i') {
      event.preventDefault();
      formatBody(key === 'b' ? 'bold' : 'italic');
    }
  }

  async function createFolder(event) {
    event.preventDefault(); if (!newFolderName.trim()) return;
    try { const folder = await folderApi.create(newFolderName.trim(), auth); setFolders(items => [...items, folder].sort((a, b) => a.name.localeCompare(b.name))); setNewFolderName(''); setActiveFolder(folder.id); setDraft(current => current.id ? current : { ...current, folderId: folder.id }); setNotice(`Folder “${folder.name}” created.`); setError(''); }
    catch (folderError) { setError(folderError.message); }
  }

  async function renameFolder(folder) {
    const name = window.prompt('New folder name', folder.name);
    if (!name?.trim() || name.trim().toLowerCase() === folder.name) return;
    try { const updated = await folderApi.update(folder.id, name.trim(), auth); setFolders(items => items.map(item => item.id === updated.id ? updated : item).sort((a, b) => a.name.localeCompare(b.name))); setNotice('Folder renamed.'); setError(''); }
    catch (folderError) { setError(folderError.message); }
  }

  async function deleteFolder(folder) {
    if (!window.confirm(`Delete folder “${folder.name}”? Notes will stay in your workspace as unfiled.`)) return;
    try { await folderApi.remove(folder.id, auth); setFolders(items => items.filter(item => item.id !== folder.id)); setNotes(items => items.map(note => note.folderId === folder.id ? { ...note, folderId: null } : note)); if (activeFolder === folder.id) setActiveFolder('all'); setDraft(current => current.folderId === folder.id ? { ...current, folderId: null } : current); setNotice('Folder deleted. Its notes are still saved as unfiled.'); setError(''); }
    catch (folderError) { setError(folderError.message); }
  }

  async function saveNote(event) {
    event.preventDefault();
    if (!draft.body.trim()) { setError('Write some note content before saving.'); return; }
    const tags = draft.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    if (tags.length > 10) { setError('A note can have up to 10 tags. Remove a few tags and try again.'); return; }
    setSaving(true); setError(''); setNotice('');
    const title = draft.title.trim() || draft.body.trim().split(/\r?\n/, 1)[0].slice(0, 120) || 'Untitled note';
    const payload = { title, body: draft.body, tags, folderId: draft.folderId || null };
    try {
      const note = draft.id ? await noteApi.update(draft.id, payload, auth) : await noteApi.create(payload, auth);
      setDraft(asDraft(note));
      setNotes(items => [note, ...items.filter(item => item.id !== note.id)]);
      setNotice('Note saved to your private workspace.');
      setEditorOpen(false);
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  }

  async function deleteNote() {
    if (!draft.id || !window.confirm('Delete this note? This cannot be undone.')) return;
    try {
      await noteApi.remove(draft.id, auth);
      setNotes(items => items.filter(note => note.id !== draft.id));
      setDraft(emptyDraft(activeFolder !== 'all' && activeFolder !== 'unfiled' ? activeFolder : null));
      setNotice('Note deleted.');
      setError('');
      setEditorOpen(false);
    } catch (deleteError) { setError(deleteError.message); }
  }

  const visibleNotes = notes.filter(note => activeFolder === 'all' || (activeFolder === 'unfiled' ? !note.folderId : note.folderId === activeFolder));
  const folderCounts = new Map(folders.map(folder => [folder.id, notes.filter(note => note.folderId === folder.id).length]));

  return <WorkspaceShell active="notes"><div className="notes-page notes-dashboard">
    <div className="notes-dashboard-heading"><div><p className="eyebrow"><BookOpen size={13} /> YOUR LEARNING SPACE</p><h1>My Notes</h1><p>Organize your study notes and pick up where you left off.</p></div><label className="notes-search notes-heading-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search notes…" /></label><button className="notes-new-button" onClick={newNote}><Plus size={16} /> New note</button></div>
    {(error || notice) && <p className={`note-feedback ${error ? 'error' : 'success'}`} role={error ? 'alert' : 'status'}>{error || notice}</p>}
    <div className="notes-dashboard-layout">
      <section className="notes-cards-section">
        <div className="notes-toolbar"><div className="notes-filter-tabs"><button className={activeFolder === 'all' ? 'selected' : ''} onClick={() => setActiveFolder('all')}>All notes <span>{notes.length}</span></button><button className={activeFolder === 'unfiled' ? 'selected' : ''} onClick={() => setActiveFolder('unfiled')}>Unfiled <span>{notes.filter(note => !note.folderId).length}</span></button>{folders.map(folder => <button key={folder.id} className={activeFolder === folder.id ? 'selected' : ''} onClick={() => setActiveFolder(folder.id)}>{folder.name}<span>{folderCounts.get(folder.id) || 0}</span></button>)}</div></div>
        {loading ? <div className="notes-grid-state"><LoaderCircle size={18} className="spin" /> Loading your notes…</div> : visibleNotes.length ? <div className="notes-card-grid">{visibleNotes.map((note, index) => <article key={note.id} className={`notes-preview-card note-accent-${index % 3}`}><button className="notes-card-open" onClick={() => { setDraft(asDraft(note)); setError(''); setNotice(''); setEditorOpen(true); }}><span className="notes-card-icon"><FileText size={19} /></span><b>{note.title}</b><span className="notes-card-body">{(note.body || '').slice(0, 124) || 'No content yet'}</span><small>Last edited {new Date(note.updatedAt).toLocaleDateString()}</small></button><div className="notes-card-footer"><span>{note.tags?.length ? note.tags.slice(0, 2).map(tag => <i key={tag}>{tag}</i>) : <i>{folders.find(folder => folder.id === note.folderId)?.name || 'Study note'}</i>}</span><button onClick={() => { setDraft(asDraft(note)); setError(''); setNotice(''); setEditorOpen(true); }} aria-label={`Edit ${note.title}`}><Pencil size={14} /></button></div></article>)}</div> : <div className="notes-empty-card"><span><FileText size={22} /></span><h2>{query ? 'No matching notes' : 'Your notes start here'}</h2><p>{query ? 'Try a different search or clear your search field.' : 'Save key ideas, summaries, and questions as you study.'}</p><button className="notes-new-button" onClick={newNote}><Plus size={16} /> Create your first note</button></div>}
      </section>
      <aside className="notes-quick-actions"><h2>Quick actions</h2><p>Keep your study space organized.</p><button onClick={newNote}><span className="quick-action-icon purple"><Pencil size={17} /></span><span><b>Create new note</b><small>Capture a new idea</small></span><Plus size={15} /></button><Link to="/app/documents"><span className="quick-action-icon blue"><Upload size={17} /></span><span><b>Upload document</b><small>Add a PDF or class file</small></span><span className="quick-arrow">›</span></Link><div className="notes-organize"><div><span className="quick-action-icon green"><Folder size={17} /></span><span><b>Organize by subject</b><small>Create a folder for a class</small></span></div><form className="folder-create-form" onSubmit={createFolder}><input value={newFolderName} onChange={event => setNewFolderName(event.target.value)} maxLength={48} placeholder="e.g. Biology" aria-label="Create subject folder" /><button disabled={!newFolderName.trim()} aria-label="Create subject folder"><Plus size={15} /></button></form>{folders.length > 0 && <div className="notes-quick-folder-list">{folders.map(folder => <div key={folder.id}><span>{folder.name}</span><button onClick={() => renameFolder(folder)} aria-label={`Rename ${folder.name}`}><Pencil size={12} /></button><button onClick={() => deleteFolder(folder)} aria-label={`Delete ${folder.name}`}><Trash2 size={12} /></button></div>)}</div>}</div><div className="notes-private-note"><ShieldCheck size={15} /> Your notes are private to your workspace.</div></aside>
    </div>
    {editorOpen && createPortal(<div className="notes-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setEditorOpen(false); }}><form className="note-editor notes-editor-modal" onSubmit={saveNote}>
        <div className="note-editor-toolbar"><div><span>{draft.id ? 'Edit note' : 'New note'}</span></div><div><button type="button" className="notes-modal-close" onClick={() => setEditorOpen(false)} aria-label="Close editor"><X size={18} /></button>{draft.id && <button type="button" className="note-delete-button" onClick={deleteNote} aria-label="Delete note"><Trash2 size={15} /></button>}<button type="submit" className="note-save-button" disabled={saving}>{saving ? <LoaderCircle size={14} className="spin" /> : <Save size={14} />}{saving ? 'Saving…' : 'Save note'}</button></div></div>
        {error && <p className="note-feedback error" role="alert">{error}</p>}{notice && <p className="note-feedback success" role="status">{notice}</p>}
        <input className="note-title-input" value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} placeholder="Note title" maxLength={120} aria-label="Note title" />
        <label className="note-folder-select">Folder<select value={draft.folderId || ''} onChange={event => setDraft(current => ({ ...current, folderId: event.target.value || null }))}><option value="">Unfiled</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
        <input className="note-tags-input" value={draft.tags} onChange={event => setDraft(current => ({ ...current, tags: event.target.value }))} placeholder="Tags, separated by commas" aria-label="Note tags" />
        <div className="note-format-toolbar" role="toolbar" aria-label="Note formatting">
          <button type="button" onClick={() => formatBody('bold')} title="Bold (Ctrl+B)" aria-label="Bold"><Bold size={17} /></button>
          <button type="button" onClick={() => formatBody('italic')} title="Italic (Ctrl+I)" aria-label="Italic"><Italic size={17} /></button>
          <span aria-hidden="true" />
          <button type="button" onClick={() => formatBody('heading')} title="Heading" aria-label="Add heading"><Heading2 size={17} /></button>
          <button type="button" onClick={() => formatBody('bullets')} title="Bulleted list" aria-label="Add bulleted list"><List size={17} /></button>
          <button type="button" onClick={() => formatBody('numbers')} title="Numbered list" aria-label="Add numbered list"><ListOrdered size={17} /></button>
          <button type="button" onClick={() => formatBody('quote')} title="Quote" aria-label="Add quote"><Quote size={17} /></button>
          <button type="button" onClick={() => formatBody('code')} title="Code block" aria-label="Add code block"><Code2 size={17} /></button>
        </div>
        <textarea ref={bodyInputRef} className="note-body-input" style={{ resize: 'none' }} value={draft.body} onChange={event => setDraft(current => ({ ...current, body: event.target.value }))} onKeyDown={handleBodyKeyDown} placeholder="Write down a concept, question, or insight…" maxLength={10000} aria-label="Note content" />
        <div className="note-editor-footer"><ShieldCheck size={13} /> Saved privately to your account <span>{draft.body.length.toLocaleString()} / 10,000</span></div>
      </form></div>, document.body)}
  </div></WorkspaceShell>;
}
