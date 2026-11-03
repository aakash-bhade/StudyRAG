import { useCallback, useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, Bot, Check, FileText, Globe2, LoaderCircle, MessageCircle, Pencil, Plus, Send, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { documentApi } from '../../services/documentApi.js';
import { chatApi } from '../../services/chatApi.js';
import { sourceApi } from '../../services/sourceApi.js';
import { savedItemApi } from '../../services/savedItemApi.js';

export default function ChatPage() {
  const { accessToken, refreshAccessToken } = useAuth();
  const auth = { token: accessToken, refreshAccessToken };
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [selectedWebsites, setSelectedWebsites] = useState([]);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [savedKeys, setSavedKeys] = useState(new Set());
  const [savingKey, setSavingKey] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [documentResult, sourceResult, conversationResult, savedResult] = await Promise.all([documentApi.list({ ...auth }), sourceApi.list(auth), chatApi.list(auth), savedItemApi.list(auth)]);
      setDocuments(documentResult.items);
      setWebsites(sourceResult.items);
      setConversations(conversationResult.items);
      setSavedKeys(new Set(savedResult.map(item => `${item.sourceType}-${item.sourceId}-${item.ordinal}`)));
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }, [accessToken, refreshAccessToken]);

  useEffect(() => { load(); }, [load]);

  function toggleDocument(id) {
    setSelected(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  }

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
    setSelected([]);
    setSelectedWebsites([]);
    setError('');
  }

  async function openConversation(id) {
    if (id === conversationId) return;
    setError('');
    try {
      const conversation = await chatApi.get(id, auth);
      setConversationId(conversation.id);
      setSelected(conversation.sourceFilters || []);
      setSelectedWebsites(conversation.websiteSourceFilters || []);
      setMessages(conversation.messages);
    } catch (loadError) { setError(loadError.message); }
  }

  function beginRename(conversation) {
    setRenamingId(conversation.id);
    setRenameTitle(conversation.title);
  }

  async function saveRename(event) {
    event.preventDefault();
    const title = renameTitle.trim();
    if (!title || !renamingId || renaming) return;
    setRenaming(true);
    try {
      const updated = await chatApi.rename(renamingId, title, auth);
      setConversations(items => items.map(item => item.id === updated.id ? updated : item));
      setRenamingId(null);
      setError('');
    } catch (renameError) { setError(renameError.message); }
    finally { setRenaming(false); }
  }

  async function deleteSavedConversation(id) {
    if (!id || deleting) return;
    setDeleting(true);
    try {
      await chatApi.remove(id, auth);
      setConversations(items => items.filter(item => item.id !== id));
      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
      }
      setConfirmDeleteId(null);
      setError('');
    } catch (deleteError) { setError(deleteError.message); }
    finally { setDeleting(false); }
  }

  async function submit(event) {
    event.preventDefault();
    const value = question.trim();
    if (!value || sending) return;
    setError('');
    setQuestion('');
    setMessages(items => [...items, { role: 'user', text: value }, { role: 'assistant', pending: true }]);
    setSending(true);
    try {
      const result = await chatApi.ask(value, selected, conversationId, auth, selectedWebsites);
      setConversationId(result.conversation.id);
      setMessages(items => [...items.slice(0, -1), result.messages[1]]);
      setConversations(items => [result.conversation, ...items.filter(item => item.id !== result.conversation.id)].slice(0, 30));
    } catch (requestError) {
      setMessages(items => items.slice(0, -1));
      setError(requestError.message);
      setQuestion(value);
    } finally { setSending(false); }
  }

  async function savePassage(source) {
    const sourceId = source.sourceType === 'website' ? source.websiteSourceId : source.documentId;
    const key = `${source.sourceType}-${sourceId}-${source.ordinal}`;
    setSavingKey(key); setError('');
    try { await savedItemApi.save({ sourceType: source.sourceType, sourceId, ordinal: source.ordinal, excerpt: source.text }, auth); setSavedKeys(current => new Set([...current, key])); }
    catch (saveError) { setError(saveError.message); }
    finally { setSavingKey(''); }
  }

  return <WorkspaceShell active="chat"><div className="chat-page">
    <div className="documents-heading chat-heading"><div><p className="eyebrow"><Sparkles size={13} /> GROUNDED STUDY CHAT</p><h1>Ask your materials</h1><p>Answers use passages from your private documents and include source references.</p></div><span className="documents-count"><ShieldCheck size={15} /> Private to you</span></div>
    <div className="chat-layout">
      <section className="chat-panel" aria-label="StudyRAG conversation">
        <div className="chat-messages" aria-live="polite">
          {!messages.length && <div className="chat-welcome"><span><Bot size={25} /></span><h2>What would you like to understand?</h2><p>Ask a question about your uploaded study materials. Select documents from the panel to focus your search.</p><div className="chat-suggestions"><button onClick={() => setQuestion('Summarize the key ideas in my materials')}>Summarize key ideas</button><button onClick={() => setQuestion('Explain the main concepts simply')}>Explain concepts</button></div></div>}
          {messages.map((message, index) => <article className={`chat-message ${message.role}`} key={index}>
            <span className="chat-message-icon">{message.role === 'user' ? <MessageCircle size={16} /> : <Bot size={16} />}</span>
            <div className="chat-message-body">{message.pending ? <p className="chat-loading"><LoaderCircle size={15} className="spin" /> Searching your materials…</p> : message.role === 'user' ? <p>{message.text}</p> : <>
              {message.answer && <p className="chat-answer">{message.answer}</p>}
              {message.message && <p className="chat-note">{message.message}</p>}
              {message.retrievalMode && <span className="chat-retrieval-mode">{message.retrievalMode === 'hybrid' ? 'Semantic + keyword search' : 'Keyword search'}</span>}
              {!!message.sources?.length && <div className="chat-sources"><b>Sources</b>{message.sources.map((source, sourceIndex) => { const sourceId = source.sourceType === 'website' ? source.websiteSourceId : source.documentId; const saveKey = `${source.sourceType}-${sourceId}-${source.ordinal}`; const saved = savedKeys.has(saveKey); return <details key={saveKey}><summary>{source.sourceType === 'website' ? <Globe2 size={13} /> : <FileText size={13} />} [{sourceIndex + 1}] {source.documentName}{source.page ? ` · page ${source.page}` : ` · section ${source.ordinal + 1}`}</summary><div className="chat-citation-actions">{source.url && <a className="chat-citation-link" href={source.url} target="_blank" rel="noreferrer">Open webpage source ↗</a>}<button disabled={saved || savingKey === saveKey} onClick={() => savePassage(source)}>{saved ? <BookmarkCheck size={13} /> : savingKey === saveKey ? <LoaderCircle size={13} className="spin" /> : <Bookmark size={13} />}{saved ? 'Saved' : 'Save passage'}</button></div><p>{source.text}</p></details>; })}</div>}
            </>}</div>
          </article>)}
        </div>
        {error && <p className="chat-error" role="alert">{error}</p>}
        <form className="chat-composer" onSubmit={submit}><textarea aria-label="Ask a question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask something about your study materials…" maxLength={1200} rows={2} /><button type="submit" disabled={sending || question.trim().length < 3} aria-label="Send question"><Send size={17} /></button><small>Answers are grounded in the selected uploaded materials.</small></form>
      </section>
      <aside className="chat-source-panel"><button className="chat-new-button" onClick={startNewConversation}><Plus size={14} /> New conversation</button><h2><FileText size={16} /> Search sources</h2><p>Select sources, or leave all unchecked to search everything.</p>{loading ? <div className="chat-source-state"><LoaderCircle size={15} className="spin" /> Loading sources…</div> : <><div className="chat-source-list">{documents.map(document => <label key={document.id}><input type="checkbox" checked={selected.includes(document.id)} onChange={() => toggleDocument(document.id)} /><span className="chat-source-file"><FileText size={15} /><span><b>{document.displayName}</b><small>{document.chunkCount} searchable sections</small></span></span></label>)}{websites.map(source => <label key={source.id}><input type="checkbox" checked={selectedWebsites.includes(source.id)} onChange={() => setSelectedWebsites(ids => ids.includes(source.id) ? ids.filter(value => value !== source.id) : [...ids, source.id])} /><span className="chat-source-file"><Globe2 size={15} /><span><b>{source.title}</b><small>{source.chunkCount} webpage sections</small></span></span></label>)}</div>{!documents.length && !websites.length && <div className="chat-no-documents"><p>Add a document or public webpage to start asking questions.</p><a href="/app/documents">Documents →</a><br /><a href="/app/sources">Website sources →</a></div>}</>}<h2 className="chat-recent-heading"><MessageCircle size={15} /> Recent conversations</h2><div className="chat-recent-list">{conversations.length ? conversations.map(conversation => <div className={`chat-recent-item ${conversation.id === conversationId ? 'selected' : ''}`} key={conversation.id}>{renamingId === conversation.id ? <form onSubmit={saveRename}><input autoFocus aria-label="Conversation title" value={renameTitle} maxLength={120} onChange={event => setRenameTitle(event.target.value)} /><button type="submit" disabled={renaming || !renameTitle.trim()} aria-label="Save conversation title"><Check size={13} /></button><button type="button" disabled={renaming} onClick={() => setRenamingId(null)} aria-label="Cancel rename"><X size={13} /></button></form> : confirmDeleteId === conversation.id ? <div className="chat-recent-confirm"><span>Delete?</span><button disabled={deleting} onClick={() => deleteSavedConversation(conversation.id)} aria-label="Confirm delete conversation"><Check size={13} /></button><button disabled={deleting} onClick={() => setConfirmDeleteId(null)} aria-label="Cancel delete"><X size={13} /></button></div> : <><button className="chat-recent-open" onClick={() => openConversation(conversation.id)} title={conversation.title}>{conversation.title}</button><button className="chat-recent-rename" onClick={() => beginRename(conversation)} aria-label={`Rename ${conversation.title}`} title="Rename"><Pencil size={12} /></button><button className="chat-recent-delete" onClick={() => setConfirmDeleteId(conversation.id)} aria-label={`Delete ${conversation.title}`} title="Delete"><Trash2 size={12} /></button></>}</div>) : <span>No saved conversations yet.</span>}</div><div className="chat-scope-note"><ShieldCheck size={14} /> Only your own sources are searched.</div></aside>
    </div>
  </div></WorkspaceShell>;
}
