import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileText, FileUp, FileWarning, LoaderCircle, Pencil, Search, ShieldCheck, Trash2, UploadCloud, X } from 'lucide-react';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { documentApi } from '../../services/documentApi.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const formatBytes = bytes => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function DocumentsPage() {
  const { accessToken, refreshAccessToken } = useAuth();
  const inputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [preview, setPreview] = useState(null);

  const authOptions = { token: accessToken, refreshAccessToken };
  const loadDocuments = useCallback(async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const result = await documentApi.list({ ...authOptions, query: search });
      setDocuments(result.items);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken, refreshAccessToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadDocuments(query), query ? 220 : 0);
    return () => window.clearTimeout(timer);
  }, [query, loadDocuments]);

  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url); }, [preview]);

  async function uploadFile(file) {
    if (!file || uploading) return;
    setError('');
    setNotice('');
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(extension)) { setError('PDF, DOCX, and TXT files are supported.'); return; }
    if (file.size > MAX_FILE_SIZE) { setError('Choose a file that is 10 MB or smaller.'); return; }
    setUploading(true);
    try {
      const result = await documentApi.upload(file, authOptions);
      if (query) await loadDocuments(query);
      else setDocuments(items => [result.item, ...items]);
      setNotice(`${result.item.displayName} is ready in your private workspace.`);
      if (inputRef.current) inputRef.current.value = '';
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  async function downloadDocument(document, asPreview = false) {
    setError('');
    try {
      const blob = await documentApi.download(document.id, authOptions);
      const url = URL.createObjectURL(blob);
      if (asPreview) setPreview({ url, name: document.displayName });
      else {
        const anchor = window.document.createElement('a');
        anchor.href = url;
        anchor.download = document.displayName;
        anchor.click();
        URL.revokeObjectURL(url);
      }
    } catch (downloadError) { setError(downloadError.message); }
  }

  async function saveRename(document) {
    const displayName = renameValue.trim();
    if (!displayName) return;
    try {
      const result = await documentApi.rename(document.id, displayName, authOptions);
      setDocuments(items => items.map(item => item.id === document.id ? result.item : item));
      setRenamingId(null);
      setNotice('Document name updated.');
    } catch (renameError) { setError(renameError.message); }
  }

  async function deleteDocument(document) {
    if (!window.confirm(`Delete “${document.displayName}” and its extracted text? This cannot be undone.`)) return;
    try {
      await documentApi.remove(document.id, authOptions);
      setDocuments(items => items.filter(item => item.id !== document.id));
      setNotice('Document deleted.');
    } catch (deleteError) { setError(deleteError.message); }
  }

  function closePreview() {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  return <WorkspaceShell active="documents">
    <div className="documents-heading"><div><p className="eyebrow"><FileText size={14} /> YOUR KNOWLEDGE LIBRARY</p><h1>My documents</h1><p>Upload study materials and ask questions about their content.</p></div><span className="documents-count"><FileText size={15} /> {documents.length} {documents.length === 1 ? 'document' : 'documents'}</span></div>

    <div className={`upload-zone ${dragging ? 'is-dragging' : ''}`} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }} onDrop={event => { event.preventDefault(); setDragging(false); uploadFile(event.dataTransfer.files?.[0]); }}>
      <input ref={inputRef} className="visually-hidden" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={event => uploadFile(event.target.files?.[0])} />
      <span className="upload-zone-icon"><UploadCloud size={22} /></span>
      <div className="upload-zone-copy"><b>Drop a file here, or <button type="button" onClick={() => inputRef.current?.click()}>browse files</button></b><span>PDF, DOCX, or TXT · up to 10 MB</span></div>
      <button className="button button-primary upload-button" type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? <><LoaderCircle className="spin" size={16} /> Processing…</> : <><FileUp size={16} /> Upload document</>}</button>
    </div>

    {error && <p className="document-alert error" role="alert"><FileWarning size={16} /> {error}</p>}
    {notice && <p className="document-alert success" role="status"><ShieldCheck size={16} /> {notice}</p>}

    <div className="documents-toolbar"><div><h2>Your library</h2></div><label className="document-search"><Search size={16} /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search documents" aria-label="Search documents" /></label></div>

    {loading ? <div className="documents-state"><LoaderCircle className="spin" size={20} /> Loading your documents…</div> : documents.length === 0 ? <div className="documents-empty"><span><FileText size={23} /></span><h3>{query ? 'No matching documents' : 'Your library is ready'}</h3><p>{query ? 'Try a different name or clear your search.' : 'Upload a source to start building your private knowledge library.'}</p>{query && <button className="clear-search" onClick={() => setQuery('')}>Clear search</button>}</div> : <div className="document-list">{documents.map(document => <article className="document-row" key={document.id}>
      <span className={`document-type-icon ${document.mimeType === 'application/pdf' ? 'pdf' : document.mimeType === 'text/plain' ? 'txt' : 'docx'}`}><FileText size={20} /></span>
      <div className="document-main">{renamingId === document.id ? <form className="rename-form" onSubmit={event => { event.preventDefault(); saveRename(document); }}><input autoFocus maxLength={180} value={renameValue} onChange={event => setRenameValue(event.target.value)} aria-label="New document name" /><button type="submit" aria-label="Save name"><ShieldCheck size={16} /></button><button type="button" aria-label="Cancel rename" onClick={() => setRenamingId(null)}><X size={16} /></button></form> : <><h3 title={document.displayName}>{document.displayName}</h3><p>{document.mimeType === 'application/pdf' ? 'PDF' : document.mimeType === 'text/plain' ? 'TXT' : 'DOCX'} <span>·</span> {formatBytes(document.byteSize)}{document.pageCount ? <> <span>·</span> {document.pageCount} pages</> : null} <span>·</span> {new Date(document.createdAt).toLocaleDateString()}</p></>}</div>
      <span className="ready-label"><i /> Ready</span>
      <div className="document-actions">{document.mimeType !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && <button onClick={() => downloadDocument(document, true)} title="Preview document" aria-label={`Preview ${document.displayName}`}><FileText size={16} /></button>}<button onClick={() => downloadDocument(document)} title="Download document" aria-label={`Download ${document.displayName}`}><Download size={16} /></button>{renamingId !== document.id && <button onClick={() => { setRenamingId(document.id); setRenameValue(document.displayName); }} title="Rename document" aria-label={`Rename ${document.displayName}`}><Pencil size={16} /></button>}<button className="delete-action" onClick={() => deleteDocument(document)} title="Delete document" aria-label={`Delete ${document.displayName}`}><Trash2 size={16} /></button></div>
    </article>)}</div>}
    {preview && <div className="document-preview-backdrop" onMouseDown={event => event.target === event.currentTarget && closePreview()}><section className="document-preview-dialog" role="dialog" aria-modal="true" aria-label={`Preview ${preview.name}`}><header><span><FileText size={16} /> {preview.name}</span><button onClick={closePreview} aria-label="Close preview"><X size={19} /></button></header><iframe title={`Preview of ${preview.name}`} src={preview.url} /></section></div>}
  </WorkspaceShell>;
}
