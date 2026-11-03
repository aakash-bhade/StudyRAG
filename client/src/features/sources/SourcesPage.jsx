import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Globe2, LoaderCircle, Plus, RotateCw, ShieldCheck, Trash2 } from 'lucide-react';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { sourceApi } from '../../services/sourceApi.js';

export default function SourcesPage() {
  const { accessToken, refreshAccessToken } = useAuth();
  const auth = { token: accessToken, refreshAccessToken };
  const [sources, setSources] = useState([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState('');
  const [refreshing, setRefreshing] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try { const result = await sourceApi.list(auth); setSources(result.items); setError(''); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [accessToken, refreshAccessToken]);

  useEffect(() => { load(); }, [load]);

  async function add(event) {
    event.preventDefault(); if (saving || !url.trim()) return;
    setSaving(true); setError(''); setNotice('');
    try { const result = await sourceApi.add(url.trim(), auth); setSources(items => [result.item, ...items]); setUrl(''); setNotice('Webpage added and ready to search in Ask materials.'); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function remove(id) {
    setRemoving(id); setError('');
    try { await sourceApi.remove(id, auth); setSources(items => items.filter(item => item.id !== id)); }
    catch (e) { setError(e.message); }
    finally { setRemoving(''); }
  }

  async function refresh(id) {
    setRefreshing(id); setError(''); setNotice('');
    try { const result = await sourceApi.refresh(id, auth); setSources(items => items.map(item => item.id === id ? result.item : item)); setNotice('Webpage refreshed. Ask materials will now search its latest indexed content.'); }
    catch (e) { setError(e.message); }
    finally { setRefreshing(''); }
  }

  return <WorkspaceShell active="sources"><div className="documents-page">
    <div className="documents-heading"><div><p className="eyebrow"><Globe2 size={13} /> WEB SOURCES</p><h1>Website sources</h1><p>Add a public webpage to include its content in your study chat.</p></div><span className="documents-count"><ShieldCheck size={15} /> Private to you</span></div>
    <section className="source-add-card"><h2>Add a webpage</h2><p>StudyRAG saves readable text from public HTML pages. Login-only pages and files are not supported.</p><form onSubmit={add}><label htmlFor="website-url">Website URL</label><div><input id="website-url" type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://example.com/article" maxLength={2048} required /><button type="submit" disabled={saving}>{saving ? <LoaderCircle size={15} className="spin" /> : <Plus size={15} />} {saving ? 'Adding…' : 'Add source'}</button></div></form></section>
    {error && <p className="source-feedback error" role="alert">{error}</p>}{notice && <p className="source-feedback success" role="status">{notice}</p>}
    <div className="source-list-heading"><h2>Your sources</h2><span>{sources.length} saved</span></div>
    {loading ? <div className="documents-empty"><LoaderCircle className="spin" size={20} /> Loading website sources…</div> : sources.length ? <div className="website-source-list">{sources.map(source => <article key={source.id}><span className="website-source-icon"><Globe2 size={18} /></span><div className="website-source-details"><b>{source.title}</b><a href={source.url} target="_blank" rel="noreferrer">{source.canonicalHost}<ExternalLink size={12} /></a><small>{source.chunkCount} searchable sections · refreshed {new Date(source.fetchedAt).toLocaleDateString()}</small></div><div className="website-source-actions"><button className="source-refresh" onClick={() => refresh(source.id)} disabled={Boolean(refreshing || removing)} aria-label={`Refresh ${source.title}`} title="Refresh webpage">{refreshing === source.id ? <LoaderCircle size={15} className="spin" /> : <RotateCw size={15} />}</button><button className="source-delete" onClick={() => remove(source.id)} disabled={Boolean(removing || refreshing)} aria-label={`Remove ${source.title}`}>{removing === source.id ? <LoaderCircle size={16} className="spin" /> : <Trash2 size={16} />}</button></div></article>)}</div> : <div className="documents-empty"><Globe2 size={24} /><b>No website sources yet</b><span>Add a public article, guide, or reference page to search it in chat.</span></div>}
  </div></WorkspaceShell>;
}
