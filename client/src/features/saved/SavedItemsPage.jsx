import { useCallback, useEffect, useState } from 'react';
import { Bookmark, FileText, Globe2, LoaderCircle, Trash2 } from 'lucide-react';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { savedItemApi } from '../../services/savedItemApi.js';

export default function SavedItemsPage() {
  const { accessToken, refreshAccessToken } = useAuth();
  const auth = { token: accessToken, refreshAccessToken };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await savedItemApi.list(auth)); } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [accessToken, refreshAccessToken]);
  useEffect(() => { load(); }, [load]);
  async function remove(item) {
    try { await savedItemApi.remove(item.id, auth); setItems(current => current.filter(row => row.id !== item.id)); }
    catch (e) { setError(e.message); }
  }
  return <WorkspaceShell active="saved"><div className="saved-page">
    <div className="documents-heading"><div><p className="eyebrow"><Bookmark size={13} /> QUICK REVISION</p><h1>Saved items</h1><p>Important cited passages you bookmarked from your study chats.</p></div><span className="documents-count"><Bookmark size={14} /> {items.length} saved</span></div>
    {error && <p className="note-feedback error" role="alert">{error}</p>}
    {loading ? <div className="notes-list-state"><LoaderCircle size={15} className="spin" /> Loading saved passages…</div> : items.length ? <div className="saved-items-list">{items.map(item => <article className="saved-item-card" key={item.id}><header><span>{item.sourceType === 'website' ? <Globe2 size={15} /> : <FileText size={15} />}{item.sourceName}{item.page ? ` · page ${item.page}` : ` · section ${item.ordinal + 1}`}</span><button onClick={() => remove(item)} aria-label={`Remove saved passage from ${item.sourceName}`}><Trash2 size={14} /></button></header><blockquote>{item.excerpt}</blockquote><footer>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">Open source ↗</a> : <a href="/app/documents">View documents →</a>}<small>Saved {new Date(item.createdAt).toLocaleDateString()}</small></footer></article>)}</div> : <div className="saved-empty"><Bookmark size={24} /><h2>No saved passages yet</h2><p>In Ask materials, open a cited source and use “Save passage” for snippets you want to revisit.</p><a href="/app/chat">Go to Ask materials →</a></div>}
  </div></WorkspaceShell>;
}
