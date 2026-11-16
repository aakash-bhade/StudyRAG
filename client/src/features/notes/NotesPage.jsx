import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bold, BookOpen, Code2, FileText, Folder, Heading2, Italic, List, ListOrdered, LoaderCircle, Pencil, Plus, Quote, Redo2, Save, Search, ShieldCheck, Trash2, Undo2, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { noteApi } from '../../services/noteApi.js';
import { folderApi } from '../../services/folderApi.js';

const emptyDraft = (folderId = null) => ({ id: null, title: '', body: '', tags: '', folderId });
const asDraft = note => ({ ...note, body: note.body || '', folderId: note.folderId || null, tags: Array.isArray(note.tags) ? note.tags.join(', ') : '' });

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function markdownToHtml(markdown) {
  const inline = value => escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let list = '';
  const closeList = () => { if (list) { html.push(`</${list}>`); list = ''; } };
  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.*)$/);
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    const quote = line.match(/^>\s?(.*)$/);
    const code = line.startsWith('    ');
    if (bullet || numbered) {
      const nextList = bullet ? 'ul' : 'ol';
      if (list !== nextList) { closeList(); html.push(`<${nextList}>`); list = nextList; }
      html.push(`<li>${inline((bullet || numbered)[1])}</li>`);
    } else {
      closeList();
      if (heading) html.push(`<h${Math.min(line.match(/^#+/)[0].length + 1, 4)}>${inline(heading[1])}</h${Math.min(line.match(/^#+/)[0].length + 1, 4)}>`);
      else if (quote) html.push(`<blockquote>${inline(quote[1])}</blockquote>`);
      else if (code) html.push(`<pre><code>${inline(line.slice(4))}</code></pre>`);
      else if (line.trim()) html.push(`<p>${inline(line)}</p>`);
      else html.push('<p><br></p>');
    }
  }
  closeList();
  return html.join('');
}

function htmlToMarkdown(html) {
  const documentFragment = new DOMParser().parseFromString(html, 'text/html').body;
  const inline = node => {
    if (node.nodeType === Node.TEXT_NODE) return (node.nodeValue || '').replace(/\u200B/g, '');
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const content = Array.from(node.childNodes, inline).join('');
    switch (node.tagName) {
      case 'BR': return '\n';
      case 'STRONG': case 'B': return content ? `**${content}**` : '';
      case 'EM': case 'I': return content ? `*${content}*` : '';
      case 'CODE': return `\`${content}\``;
      default: return content;
    }
  };
  const block = node => {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const tag = node.tagName;
    const children = Array.from(node.childNodes, inline).join('').trim();
    if (/^H[1-6]$/.test(tag)) return `## ${children}\n\n`;
    if (tag === 'P' || tag === 'DIV') return `${children}\n`;
    if (tag === 'UL' || tag === 'OL') {
      return Array.from(node.children, (item, index) => `${tag === 'UL' ? '- ' : `${index + 1}. `}${Array.from(item.childNodes, inline).join('').trim()}`).join('\n') + '\n';
    }
    if (tag === 'BLOCKQUOTE') return `${children.split('\n').map(line => `> ${line}`).join('\n')}\n`;
    if (tag === 'PRE') return `${node.textContent.split('\n').map(line => `    ${line}`).join('\n')}\n`;
    return Array.from(node.childNodes, block).join('');
  };
  return Array.from(documentFragment.childNodes, block).join('').replace(/\n{3,}/g, '\n\n').trim();
}

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
  const [activeFormats, setActiveFormats] = useState({});
  const [bodyLength, setBodyLength] = useState(0);
  const notesRequestId = useRef(0);
  const bodyInputRef = useRef(null);
  const editorBodyRef = useRef('');
  const editorHistoryRef = useRef({ past: [], future: [], present: '' });

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
  useLayoutEffect(() => {
    if (editorOpen && bodyInputRef.current) {
      bodyInputRef.current.innerHTML = markdownToHtml(editorBodyRef.current);
      editorHistoryRef.current = { past: [], future: [], present: bodyInputRef.current.innerHTML };
    }
  }, [editorOpen]);
  useEffect(() => {
    if (!editorOpen) return undefined;
    document.addEventListener('selectionchange', updateActiveFormats);
    requestAnimationFrame(updateActiveFormats);
    return () => document.removeEventListener('selectionchange', updateActiveFormats);
  }, [editorOpen]);
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

  function newNote() { editorBodyRef.current = ''; setBodyLength(0); setDraft(emptyDraft(activeFolder !== 'all' && activeFolder !== 'unfiled' ? activeFolder : null)); setError(''); setNotice(''); setEditorOpen(true); }
  function editNote(note) { editorBodyRef.current = note.body || ''; setBodyLength(editorBodyRef.current.length); setDraft(asDraft(note)); setError(''); setNotice(''); setEditorOpen(true); }

  function formatBody(mode) {
    const input = bodyInputRef.current;
    if (!input) return;
    if (mode === 'undo' || mode === 'redo') { restoreEditorHistory(mode); return; }
    input.focus();
    const selection = window.getSelection();
    if (!selection) return;
    let range = selection.rangeCount ? selection.getRangeAt(0) : document.createRange();
    if (!selection.rangeCount) { range.selectNodeContents(input); range.collapse(false); }
    if (!input.contains(range.commonAncestorContainer)) { range.selectNodeContents(input); range.collapse(false); }

    const replaceSelection = nextRange => { selection.removeAllRanges(); selection.addRange(nextRange); };
    const placeCaretAtEnd = element => { const next = document.createRange(); next.selectNodeContents(element); next.collapse(false); replaceSelection(next); };
    const wrapperFor = (node, selector) => {
      const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
      const wrapper = element?.closest(selector);
      return wrapper && input.contains(wrapper) ? wrapper : null;
    };

    if (mode === 'bold' || mode === 'italic') {
      const tag = mode === 'bold' ? 'strong' : 'em';
      const selector = mode === 'bold' ? 'strong,b' : 'em,i';
      if (range.collapsed) {
        const existing = wrapperFor(range.startContainer, selector);
        if (existing) {
          const marker = existing.textContent === '\u200B';
          if (marker) { range.setStartBefore(existing); range.collapse(true); existing.remove(); }
          else { range.setStartAfter(existing); range.collapse(true); }
          replaceSelection(range);
        } else {
          const wrapper = document.createElement(tag);
          wrapper.textContent = '\u200B';
          range.insertNode(wrapper);
          range.setStart(wrapper.firstChild, 1);
          range.collapse(true);
          replaceSelection(range);
        }
      } else {
        const startWrapper = wrapperFor(range.startContainer, selector);
        const endWrapper = wrapperFor(range.endContainer, selector);
        if (startWrapper && startWrapper === endWrapper) {
          const first = startWrapper.firstChild;
          const last = startWrapper.lastChild;
          const parent = startWrapper.parentNode;
          startWrapper.replaceWith(...Array.from(startWrapper.childNodes));
          range = document.createRange();
          range.setStartBefore(first);
          range.setEndAfter(last);
          replaceSelection(range);
          parent.normalize();
        } else {
          const fragment = range.extractContents();
          const wrapper = document.createElement(tag);
          wrapper.append(fragment);
          range.insertNode(wrapper);
          range.selectNodeContents(wrapper);
          replaceSelection(range);
        }
      }
    } else {
      const block = mode === 'quote'
        ? wrapperFor(range.startContainer, 'blockquote') || wrapperFor(range.startContainer, 'p,div,h1,h2,h3,h4,li,pre') || input
        : wrapperFor(range.startContainer, 'p,div,h1,h2,h3,h4,li,pre') || input;
      if (mode === 'heading' || mode === 'quote') {
        const currentTag = block.tagName?.toLowerCase();
        const already = mode === 'heading' ? /^h[1-4]$/.test(currentTag) : currentTag === 'blockquote';
        const replacement = document.createElement(already ? 'p' : mode === 'heading' ? 'h2' : 'blockquote');
        while (block.firstChild) replacement.append(block.firstChild);
        if (block !== input) block.replaceWith(replacement);
        else input.append(replacement);
        placeCaretAtEnd(replacement);
      } else if (mode === 'bullets' || mode === 'numbers') {
        const listTag = mode === 'bullets' ? 'ul' : 'ol';
        if (block.tagName?.toLowerCase() === 'li' && block.parentElement?.tagName.toLowerCase() === listTag) {
          const list = block.parentElement;
          const paragraphs = Array.from(list.children).map(item => { const paragraph = document.createElement('p'); while (item.firstChild) paragraph.append(item.firstChild); return paragraph; });
          list.replaceWith(...paragraphs);
          placeCaretAtEnd(paragraphs[0] || input);
        } else if (block.tagName?.toLowerCase() === 'li' && (block.parentElement?.tagName.toLowerCase() === 'ul' || block.parentElement?.tagName.toLowerCase() === 'ol')) {
          const oldList = block.parentElement;
          const nextList = document.createElement(listTag);
          let targetItem = null;
          for (const oldItem of Array.from(oldList.children)) {
            const nextItem = document.createElement('li');
            while (oldItem.firstChild) nextItem.append(oldItem.firstChild);
            if (oldItem === block) targetItem = nextItem;
            nextList.append(nextItem);
          }
          oldList.replaceWith(nextList);
          placeCaretAtEnd(targetItem || nextList);
        } else {
          const list = document.createElement(listTag);
          const item = document.createElement('li');
          if (block === input) input.append(list);
          else { while (block.firstChild) item.append(block.firstChild); block.replaceWith(list); }
          list.append(item);
          placeCaretAtEnd(item);
        }
      } else if (mode === 'code') {
        if (block.tagName?.toLowerCase() === 'pre') {
          const paragraph = document.createElement('p');
          paragraph.textContent = block.textContent;
          block.replaceWith(paragraph);
          placeCaretAtEnd(paragraph);
        } else {
          const pre = document.createElement('pre');
          const code = document.createElement('code');
          if (block === input) input.append(pre);
          else { while (block.firstChild) code.append(block.firstChild); block.replaceWith(pre); }
          pre.append(code);
          placeCaretAtEnd(code);
        }
      }
    }
    syncEditorBody();
    requestAnimationFrame(updateActiveFormats);
  }

  function updateActiveFormats() {
    const editor = bodyInputRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.anchorNode || !editor.contains(selection.anchorNode)) {
      setActiveFormats(current => Object.values(current).some(Boolean) ? {} : current);
      return;
    }
    const node = selection.anchorNode.nodeType === Node.ELEMENT_NODE ? selection.anchorNode : selection.anchorNode.parentElement;
    const has = selector => Boolean(node?.closest(selector) && editor.contains(node.closest(selector)));
    const next = {
      bold: has('strong, b'),
      italic: has('em, i'),
      heading: has('h1, h2, h3, h4'),
      bullets: Boolean(node?.closest('ul') && editor.contains(node.closest('ul'))),
      numbers: Boolean(node?.closest('ol') && editor.contains(node.closest('ol'))),
      quote: has('blockquote'),
      code: has('pre, code'),
    };
    setActiveFormats(current => Object.keys(next).every(key => current[key] === next[key]) ? current : next);
  }

  function syncEditorBody() {
    if (!bodyInputRef.current) return;
    const currentHtml = bodyInputRef.current.innerHTML;
    const history = editorHistoryRef.current;
    if (currentHtml !== history.present) {
      history.past.push(history.present);
      if (history.past.length > 100) history.past.shift();
      history.present = currentHtml;
      history.future = [];
    }
    const body = htmlToMarkdown(bodyInputRef.current.innerHTML);
    editorBodyRef.current = body;
    setBodyLength(body.length);
  }

  function restoreEditorHistory(direction) {
    const input = bodyInputRef.current;
    const history = editorHistoryRef.current;
    if (!input) return;
    const from = direction === 'undo' ? history.past : history.future;
    const to = direction === 'undo' ? history.future : history.past;
    if (!from.length) return;
    to.push(history.present);
    history.present = from.pop();
    input.innerHTML = history.present;
    input.focus();
    const body = htmlToMarkdown(input.innerHTML);
    editorBodyRef.current = body;
    setBodyLength(body.length);
    requestAnimationFrame(updateActiveFormats);
  }

  function pastePlainText(event) {
    event.preventDefault();
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
    syncEditorBody();
  }

  function handleBodyKeyDown(event) {
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    if (key === 'z' || key === 'y') {
      event.preventDefault();
      formatBody(key === 'z' && !event.shiftKey ? 'undo' : 'redo');
    } else if (key === 'b' || key === 'i') {
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
    const body = editorBodyRef.current;
    if (!body.trim()) { setError('Write some note content before saving.'); return; }
    const tags = draft.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    if (tags.length > 10) { setError('A note can have up to 10 tags. Remove a few tags and try again.'); return; }
    setSaving(true); setError(''); setNotice('');
    const title = draft.title.trim() || body.trim().split(/\r?\n/, 1)[0].slice(0, 120) || 'Untitled note';
    const payload = { title, body, tags, folderId: draft.folderId || null };
    try {
      const note = draft.id ? await noteApi.update(draft.id, payload, auth) : await noteApi.create(payload, auth);
      setDraft(asDraft(note));
      editorBodyRef.current = note.body;
      setBodyLength(note.body.length);
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
      editorBodyRef.current = '';
      setBodyLength(0);
      setDraft(emptyDraft(activeFolder !== 'all' && activeFolder !== 'unfiled' ? activeFolder : null));
      setNotice('Note deleted.');
      setError('');
      setEditorOpen(false);
    } catch (deleteError) { setError(deleteError.message); }
  }

  const visibleNotes = notes.filter(note => activeFolder === 'all' || (activeFolder === 'unfiled' ? !note.folderId : note.folderId === activeFolder));
  const folderCounts = new Map(folders.map(folder => [folder.id, notes.filter(note => note.folderId === folder.id).length]));

  return <WorkspaceShell active="notes"><div className="notes-page notes-dashboard">
    <div className="notes-dashboard-heading"><div><h1>My Notes</h1></div><label className="notes-search notes-heading-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search notes…" /></label><button className="notes-new-button" onClick={newNote}><Plus size={16} /> New note</button></div>
    {(error || notice) && <p className={`note-feedback ${error ? 'error' : 'success'}`} role={error ? 'alert' : 'status'}>{error || notice}</p>}
    <div className="notes-dashboard-layout">
      <section className="notes-cards-section">
        <div className="notes-toolbar"><div className="notes-filter-tabs"><button className={activeFolder === 'all' ? 'selected' : ''} onClick={() => setActiveFolder('all')}>All notes <span>{notes.length}</span></button><button className={activeFolder === 'unfiled' ? 'selected' : ''} onClick={() => setActiveFolder('unfiled')}>Unfiled <span>{notes.filter(note => !note.folderId).length}</span></button>{folders.map(folder => <button key={folder.id} className={activeFolder === folder.id ? 'selected' : ''} onClick={() => setActiveFolder(folder.id)}>{folder.name}<span>{folderCounts.get(folder.id) || 0}</span></button>)}</div></div>
        {loading ? <div className="notes-grid-state"><LoaderCircle size={18} className="spin" /> Loading your notes…</div> : visibleNotes.length ? <div className="notes-card-grid">{visibleNotes.map((note, index) => <article key={note.id} className={`notes-preview-card note-accent-${index % 3}`}><button className="notes-card-open" onClick={() => editNote(note)}><span className="notes-card-icon"><FileText size={19} /></span><b>{note.title}</b><span className="notes-card-body">{(note.body || '').slice(0, 124) || 'No content yet'}</span><small>Last edited {new Date(note.updatedAt).toLocaleDateString()}</small></button><div className="notes-card-footer"><span>{note.tags?.length ? note.tags.slice(0, 2).map(tag => <i key={tag}>{tag}</i>) : <i>{folders.find(folder => folder.id === note.folderId)?.name || 'Study note'}</i>}</span><button onClick={() => editNote(note)} aria-label={`Edit ${note.title}`}><Pencil size={14} /></button></div></article>)}</div> : <div className="notes-empty-card"><span><FileText size={22} /></span><h2>{query ? 'No matching notes' : 'Your notes start here'}</h2><p>{query ? 'Try a different search or clear your search field.' : 'Save key ideas, summaries, and questions as you study.'}</p><button className="notes-new-button" onClick={newNote}><Plus size={16} /> Create your first note</button></div>}
      </section>
      <aside className="notes-quick-actions"><h2>Quick actions</h2><div className="notes-organize"><div><span className="quick-action-icon green"><Folder size={17} /></span><span><b>Organize by subject</b><small>Create a folder for a class</small></span></div><form className="folder-create-form" onSubmit={createFolder}><input value={newFolderName} onChange={event => setNewFolderName(event.target.value)} maxLength={48} placeholder="e.g. Biology" aria-label="Create subject folder" /><button disabled={!newFolderName.trim()} aria-label="Create subject folder"><Plus size={15} /></button></form>{folders.length > 0 && <div className="notes-quick-folder-list">{folders.map(folder => <div key={folder.id}><span>{folder.name}</span><button onClick={() => renameFolder(folder)} aria-label={`Rename ${folder.name}`}><Pencil size={12} /></button><button onClick={() => deleteFolder(folder)} aria-label={`Delete ${folder.name}`}><Trash2 size={12} /></button></div>)}</div>}</div><button onClick={newNote}><span className="quick-action-icon purple"><Pencil size={17} /></span><span><b>Create new note</b><small>Capture a new idea</small></span><Plus size={15} /></button><Link to="/app/documents"><span className="quick-action-icon blue"><Upload size={17} /></span><span><b>Upload document</b><small>Add a PDF or class file</small></span><span className="quick-arrow">›</span></Link></aside>
    </div>
    {editorOpen && createPortal(<div className="notes-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setEditorOpen(false); }}><form className="note-editor notes-editor-modal" onSubmit={saveNote}>
        <div className="note-editor-toolbar"><div><span>{draft.id ? 'Edit note' : 'New note'}</span></div><div><button type="button" className="notes-modal-close" onClick={() => setEditorOpen(false)} aria-label="Close editor"><X size={18} /></button>{draft.id && <button type="button" className="note-delete-button" onClick={deleteNote} aria-label="Delete note"><Trash2 size={15} /></button>}<button type="submit" className="note-save-button" disabled={saving}>{saving ? <LoaderCircle size={14} className="spin" /> : <Save size={14} />}{saving ? 'Saving…' : 'Save note'}</button></div></div>
        {error && <p className="note-feedback error" role="alert">{error}</p>}{notice && <p className="note-feedback success" role="status">{notice}</p>}
        <input className="note-title-input" value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} placeholder="Note title" maxLength={120} aria-label="Note title" />
        <label className="note-folder-select">Folder<select value={draft.folderId || ''} onChange={event => setDraft(current => ({ ...current, folderId: event.target.value || null }))}><option value="">Unfiled</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
        <input className="note-tags-input" value={draft.tags} onChange={event => setDraft(current => ({ ...current, tags: event.target.value }))} placeholder="Tags, separated by commas" aria-label="Note tags" />
        <div className="note-format-toolbar" role="toolbar" aria-label="Note editing tools">
          <div className="note-format-group"><span>Text</span><div>
            <button type="button" className={activeFormats.bold ? 'is-active' : ''} aria-pressed={Boolean(activeFormats.bold)} onMouseDown={event => event.preventDefault()} onClick={() => formatBody('bold')} title="Bold (Ctrl+B)" aria-label="Bold"><Bold size={17} /></button>
            <button type="button" className={activeFormats.italic ? 'is-active' : ''} aria-pressed={Boolean(activeFormats.italic)} onMouseDown={event => event.preventDefault()} onClick={() => formatBody('italic')} title="Italic (Ctrl+I)" aria-label="Italic"><Italic size={17} /></button>
          </div></div>
          <span className="note-format-divider" aria-hidden="true" />
          <div className="note-format-group"><span>Layout</span><div>
            <button type="button" className={activeFormats.heading ? 'is-active' : ''} aria-pressed={Boolean(activeFormats.heading)} onMouseDown={event => event.preventDefault()} onClick={() => formatBody('heading')} title="Heading" aria-label="Add heading"><Heading2 size={17} /></button>
            <button type="button" className={activeFormats.bullets ? 'is-active' : ''} aria-pressed={Boolean(activeFormats.bullets)} onMouseDown={event => event.preventDefault()} onClick={() => formatBody('bullets')} title="Bulleted list" aria-label="Add bulleted list"><List size={17} /></button>
            <button type="button" className={activeFormats.numbers ? 'is-active' : ''} aria-pressed={Boolean(activeFormats.numbers)} onMouseDown={event => event.preventDefault()} onClick={() => formatBody('numbers')} title="Numbered list" aria-label="Add numbered list"><ListOrdered size={17} /></button>
          </div></div>
          <span className="note-format-divider" aria-hidden="true" />
          <div className="note-format-group"><span>More</span><div>
            <button type="button" className={activeFormats.quote ? 'is-active' : ''} aria-pressed={Boolean(activeFormats.quote)} onMouseDown={event => event.preventDefault()} onClick={() => formatBody('quote')} title="Quote" aria-label="Add quote"><Quote size={17} /></button>
            <button type="button" className={activeFormats.code ? 'is-active' : ''} aria-pressed={Boolean(activeFormats.code)} onMouseDown={event => event.preventDefault()} onClick={() => formatBody('code')} title="Code block" aria-label="Add code block"><Code2 size={17} /></button>
            <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => formatBody('undo')} title="Undo" aria-label="Undo"><Undo2 size={17} /></button>
            <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => formatBody('redo')} title="Redo" aria-label="Redo"><Redo2 size={17} /></button>
          </div></div>
        </div>
        <div ref={bodyInputRef} className="note-body-input note-rich-editor" contentEditable role="textbox" aria-multiline="true" onInput={syncEditorBody} onPaste={pastePlainText} onKeyDown={handleBodyKeyDown} data-placeholder="Write down a concept, question, or insight…" aria-label="Note content" />
        <div className="note-editor-footer"><ShieldCheck size={13} /> Saved privately to your account <span>{bodyLength.toLocaleString()} / 10,000</span></div>
      </form></div>, document.body)}
  </div></WorkspaceShell>;
}
