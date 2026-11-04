import { useCallback, useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, BookOpen, Bot, Check, CheckCheck, Copy, FileText, Globe2, LoaderCircle, MessageCircle, NotebookPen, Pencil, Plus, Send, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { documentApi } from '../../services/documentApi.js';
import { chatApi } from '../../services/chatApi.js';
import { sourceApi } from '../../services/sourceApi.js';
import { savedItemApi } from '../../services/savedItemApi.js';
import { noteApi } from '../../services/noteApi.js';
import StudyMascot from '../dashboard/StudyMascot.jsx';

function AnswerText({ text }) {
  const blocks = [];
  let paragraph = [];
  let list = [];
  let listType = null;
  let paragraphCount = 0;
  const renderInline = (value) => value.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part
  );
  const flushParagraph = () => {
    if (paragraph.length) {
      const value = paragraph.join(' ');
      const sentences = value.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).filter(Boolean);
      const pieces = paragraphCount === 0 && sentences.length > 1 ? [sentences.shift(), ...sentences] : [value];
      pieces.forEach((piece, index) => {
        if (paragraphCount === 0 && index === 0) blocks.push(<p key={`p-${blocks.length}`}>{renderInline(piece)}</p>);
        else { listType = 'unordered'; list.push(renderInline(piece)); }
      });
      paragraphCount += pieces.length;
    }
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    const List = listType === 'ordered' ? 'ol' : 'ul';
    blocks.push(<List key={`l-${blocks.length}`}>{list.map((item, index) => <li key={index}>{item}</li>)}</List>);
    list = [];
    listType = null;
  };
  for (const line of text.split('\n')) {
    const heading = line.match(/^\s*#{1,3}\s+(.+)$/);
    const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(<h3 key={`h-${blocks.length}`}>{renderInline(heading[1])}</h3>);
      continue;
    }
    if (bullet || numbered) {
      flushParagraph();
      const nextType = numbered ? 'ordered' : 'unordered';
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      list.push(renderInline((bullet || numbered)[1]));
    } else {
      flushList();
      if (line.trim()) paragraph.push(line.trim());
      else flushParagraph();
    }
  }
  flushList();
  flushParagraph();
  return <div className="chat-answer">{blocks}</div>;
}

export default function ChatPage() {
  const { accessToken, refreshAccessToken } = useAuth();
  const auth = { token: accessToken, refreshAccessToken };
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [selectedWebsites, setSelectedWebsites] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
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
  const [copiedMessage, setCopiedMessage] = useState('');
  const selectedSourceCount = selected.length + selectedWebsites.length + selectedNotes.length;
  const totalSourceCount = documents.length + websites.length + notes.length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [documentResult, sourceResult, conversationResult, savedResult, noteResult] = await Promise.all([documentApi.list({ ...auth }), sourceApi.list(auth), chatApi.list(auth), savedItemApi.list(auth), noteApi.list('', auth)]);
      setDocuments(documentResult.items);
      setWebsites(sourceResult.items);
      setNotes(noteResult);
      setConversations(conversationResult.items);
      setSavedKeys(new Set(savedResult.map(item => `${item.sourceType}-${item.sourceId}-${item.ordinal}`)));
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }, [accessToken, refreshAccessToken]);

  useEffect(() => { load(); }, [load]);

  function toggleDocument(id) {
    setSelected(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  }

  function toggleNote(id) {
    setSelectedNotes(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]);
  }

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
    setSelected([]);
    setSelectedWebsites([]);
    setSelectedNotes([]);
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
      setSelectedNotes(conversation.noteFilters || []);
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

  async function copyAnswer(message, index) {
    const content = message.answer || message.message || message.text;
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessage(message.id || String(index));
      window.setTimeout(() => setCopiedMessage(''), 1800);
    } catch { setError('Could not copy the answer. Check clipboard permissions and try again.'); }
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
      const result = await chatApi.ask(value, selected, conversationId, auth, selectedWebsites, selectedNotes, token => {
        setMessages(items => {
          const last = items.at(-1);
          if (!last?.pending && !last?.streaming) return items;
          return [...items.slice(0, -1), { ...last, pending: false, streaming: true, answer: `${last.answer || ''}${token}` }];
        });
      });
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
    <div className="documents-heading chat-heading"><div><p className="eyebrow"><Sparkles size={13} /> GROUNDED STUDY CHAT</p><h1>Ask your materials</h1><p>Your study assistant, grounded in your own sources.</p></div><span className="documents-count"><ShieldCheck size={15} /> Private to you</span><StudyMascot className="chat-mascot" /></div>
    <div className="chat-layout">
      <section className="chat-panel" aria-label="StudyRAG conversation">
        <div className="chat-messages" aria-live="polite">
          {!messages.length && <div className="chat-welcome"><span><Bot size={25} /></span><h2>What would you like to learn today?</h2><p>Ask a question, explore a concept, or summarize your study material.</p><div className="chat-suggestions"><button onClick={() => setQuestion('Summarize the key ideas in my materials')}><Sparkles size={15} /> Summarize key ideas <span>›</span></button><button onClick={() => setQuestion('Explain the main concepts simply')}><BookOpen size={15} /> Explain a concept <span>›</span></button></div></div>}
          {messages.map((message, index) => <article className={`chat-message ${message.role}`} key={index}>
            <span className="chat-message-icon">{message.role === 'user' ? <MessageCircle size={16} /> : <Bot size={16} />}</span>
            <div className="chat-message-body">{message.pending ? <p className="chat-loading"><LoaderCircle size={15} className="spin" /> Searching your materials…</p> : message.role === 'user' ? <p>{message.text}</p> : <>
              {message.answer && <div className="chat-answer-row"><div className="chat-answer-wrap"><AnswerText text={message.answer} />{message.streaming && <span className="chat-streaming-label">Writing answer…</span>}</div><button className="chat-copy-answer" onClick={() => copyAnswer(message, index)} aria-label="Copy answer" title="Copy answer">{copiedMessage === (message.id || String(index)) ? <CheckCheck size={14} /> : <Copy size={14} />}</button></div>}
              {message.message && <p className="chat-note">{message.message}</p>}
              {message.retrievalMode && <span className="chat-retrieval-mode">{message.retrievalMode === 'hybrid' ? 'Semantic + keyword search' : 'Keyword search'}</span>}
              {!!message.sources?.length && <div className="chat-sources"><b>Sources</b>{message.sources.map((source, sourceIndex) => { const sourceId = source.sourceType === 'website' ? source.websiteSourceId : source.sourceType === 'note' ? source.noteId : source.documentId; const saveKey = `${source.sourceType}-${sourceId}-${source.ordinal}`; const saved = savedKeys.has(saveKey); return <details key={saveKey}><summary>{source.sourceType === 'website' ? <Globe2 size={13} /> : source.sourceType === 'note' ? <NotebookPen size={13} /> : <FileText size={13} />} [{sourceIndex + 1}] {source.documentName}{source.sourceType === 'note' ? ' · note' : source.page ? ` · page ${source.page}` : ` · section ${source.ordinal + 1}`}</summary><div className="chat-citation-actions">{source.url && <a className="chat-citation-link" href={source.url} target="_blank" rel="noreferrer">Open webpage source ↗</a>}{source.sourceType !== 'note' && <button disabled={saved || savingKey === saveKey} onClick={() => savePassage(source)}>{saved ? <BookmarkCheck size={13} /> : savingKey === saveKey ? <LoaderCircle size={13} className="spin" /> : <Bookmark size={13} />}{saved ? 'Saved' : 'Save passage'}</button>}</div><p>{source.text}</p></details>; })}</div>}
            </>}</div>
          </article>)}
        </div>
        {error && <p className="chat-error" role="alert">{error}</p>}
        <form className="chat-composer" onSubmit={submit}><textarea aria-label="Ask a question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask something about your study materials…" maxLength={1200} rows={2} /><button type="submit" disabled={sending || question.trim().length < 3} aria-label="Send question" title="Send question"><Send size={18} /></button><small><ShieldCheck size={13} /> Answers use your private study materials</small></form>
      </section>
      <aside className="chat-source-panel" aria-label="Study material sources">
        <button className="chat-new-button" onClick={startNewConversation}><Plus size={14} /> New conversation</button>
        <div className="chat-source-heading"><h2><FileText size={16} /> Search sources</h2><span>{loading ? 'Loading…' : totalSourceCount === 0 ? 'No materials yet' : selectedSourceCount ? `${selectedSourceCount} selected` : 'All materials'}</span></div>
        <p>Choose materials to focus your answer. Leave unchecked to search all.</p>
        {loading ? <div className="chat-source-state"><LoaderCircle size={15} className="spin" /> Loading sources…</div> : <>
          <div className="chat-source-list">
            {documents.map(document => <label key={document.id}><input type="checkbox" checked={selected.includes(document.id)} onChange={() => toggleDocument(document.id)} /><span className="chat-source-file"><FileText size={15} /><span><b>{document.displayName}</b><small>{document.chunkCount} searchable sections</small></span></span></label>)}
            {websites.map(source => <label key={source.id}><input type="checkbox" checked={selectedWebsites.includes(source.id)} onChange={() => setSelectedWebsites(ids => ids.includes(source.id) ? ids.filter(value => value !== source.id) : [...ids, source.id])} /><span className="chat-source-file"><Globe2 size={15} /><span><b>{source.title}</b><small>{source.chunkCount} webpage sections</small></span></span></label>)}
            {notes.map(note => <label key={note.id}><input type="checkbox" checked={selectedNotes.includes(note.id)} onChange={() => toggleNote(note.id)} /><span className="chat-source-file"><NotebookPen size={15} /><span><b>{note.title}</b><small>{note.tags?.length ? note.tags.join(', ') : 'Saved note'}</small></span></span></label>)}
          </div>
          {!documents.length && !websites.length && !notes.length && <div className="chat-no-documents"><p>Add study material to start asking questions.</p><div className="chat-empty-links"><a href="/app/documents">Add documents</a><a href="/app/sources">Add website</a><a href="/app/notes">Add notes</a></div></div>}
        </>}
        {!!conversations.length && <><h2 className="chat-recent-heading"><MessageCircle size={15} /> Recent conversations</h2>
        <div className="chat-recent-list">{conversations.map(conversation => <div className={`chat-recent-item ${conversation.id === conversationId ? 'selected' : ''}`} key={conversation.id}>{renamingId === conversation.id ? <form onSubmit={saveRename}><input autoFocus aria-label="Conversation title" value={renameTitle} maxLength={120} onChange={event => setRenameTitle(event.target.value)} /><button type="submit" disabled={renaming || !renameTitle.trim()} aria-label="Save conversation title"><Check size={13} /></button><button type="button" disabled={renaming} onClick={() => setRenamingId(null)} aria-label="Cancel rename"><X size={13} /></button></form> : confirmDeleteId === conversation.id ? <div className="chat-recent-confirm"><span>Delete?</span><button disabled={deleting} onClick={() => deleteSavedConversation(conversation.id)} aria-label="Confirm delete conversation"><Check size={13} /></button><button disabled={deleting} onClick={() => setConfirmDeleteId(null)} aria-label="Cancel delete"><X size={13} /></button></div> : <><button className="chat-recent-open" onClick={() => openConversation(conversation.id)} title={conversation.title}>{conversation.title}</button><button className="chat-recent-rename" onClick={() => beginRename(conversation)} aria-label={`Rename ${conversation.title}`} title="Rename"><Pencil size={12} /></button><button className="chat-recent-delete" onClick={() => setConfirmDeleteId(conversation.id)} aria-label={`Delete ${conversation.title}`} title="Delete"><Trash2 size={12} /></button></>}</div>)}</div></>}
        <div className="chat-scope-note"><ShieldCheck size={14} /> Only your own sources are searched.</div>
      </aside>
    </div>
  </div></WorkspaceShell>;
}
