import { useCallback, useEffect, useState } from 'react';
import { Bot, FileText, LoaderCircle, MessageCircle, Plus, Send, ShieldCheck, Sparkles } from 'lucide-react';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { documentApi } from '../../services/documentApi.js';
import { chatApi } from '../../services/chatApi.js';

export default function ChatPage() {
  const { accessToken, refreshAccessToken } = useAuth();
  const auth = { token: accessToken, refreshAccessToken };
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState([]);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [documentResult, conversationResult] = await Promise.all([documentApi.list({ ...auth }), chatApi.list(auth)]);
      setDocuments(documentResult.items);
      setConversations(conversationResult.items);
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
    setError('');
  }

  async function openConversation(id) {
    if (id === conversationId) return;
    setError('');
    try {
      const conversation = await chatApi.get(id, auth);
      setConversationId(conversation.id);
      setSelected(conversation.sourceFilters || []);
      setMessages(conversation.messages);
    } catch (loadError) { setError(loadError.message); }
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
      const result = await chatApi.ask(value, selected, conversationId, auth);
      setConversationId(result.conversation.id);
      setMessages(items => [...items.slice(0, -1), result.messages[1]]);
      setConversations(items => [result.conversation, ...items.filter(item => item.id !== result.conversation.id)].slice(0, 30));
    } catch (requestError) {
      setMessages(items => items.slice(0, -1));
      setError(requestError.message);
      setQuestion(value);
    } finally { setSending(false); }
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
              {!!message.sources?.length && <div className="chat-sources"><b>Sources</b>{message.sources.map((source, sourceIndex) => <details key={`${source.documentId}-${source.ordinal}`}><summary><FileText size={13} /> [{sourceIndex + 1}] {source.documentName}{source.page ? ` · page ${source.page}` : ` · section ${source.ordinal + 1}`}</summary><p>{source.text}</p></details>)}</div>}
            </>}</div>
          </article>)}
        </div>
        {error && <p className="chat-error" role="alert">{error}</p>}
        <form className="chat-composer" onSubmit={submit}><textarea aria-label="Ask a question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask something about your study materials…" maxLength={1200} rows={2} /><button type="submit" disabled={sending || question.trim().length < 3} aria-label="Send question"><Send size={17} /></button><small>Answers are grounded in the selected uploaded materials.</small></form>
      </section>
      <aside className="chat-source-panel"><button className="chat-new-button" onClick={startNewConversation}><Plus size={14} /> New conversation</button><h2><FileText size={16} /> Search sources</h2><p>Select documents, or leave all unchecked to search everything.</p>{loading ? <div className="chat-source-state"><LoaderCircle size={15} className="spin" /> Loading documents…</div> : documents.length ? <div className="chat-source-list">{documents.map(document => <label key={document.id}><input type="checkbox" checked={selected.includes(document.id)} onChange={() => toggleDocument(document.id)} /><span className="chat-source-file"><FileText size={15} /><span><b>{document.displayName}</b><small>{document.chunkCount} searchable sections</small></span></span></label>)}</div> : <div className="chat-no-documents"><p>Upload a PDF, DOCX, or TXT file to start asking questions.</p><a href="/app/documents">Go to documents →</a></div>}<h2 className="chat-recent-heading"><MessageCircle size={15} /> Recent conversations</h2><div className="chat-recent-list">{conversations.length ? conversations.map(conversation => <button key={conversation.id} className={conversation.id === conversationId ? 'selected' : ''} onClick={() => openConversation(conversation.id)} title={conversation.title}>{conversation.title}</button>) : <span>No saved conversations yet.</span>}</div><div className="chat-scope-note"><ShieldCheck size={14} /> Only your own document content is searched.</div></aside>
    </div>
  </div></WorkspaceShell>;
}
