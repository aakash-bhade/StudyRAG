import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpenCheck, FileText, Globe2, Layers2, LoaderCircle, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { documentApi } from '../../services/documentApi.js';
import { sourceApi } from '../../services/sourceApi.js';
import { flashcardApi } from '../../services/flashcardApi.js';

export default function FlashcardsPage() {
  const { accessToken, refreshAccessToken } = useAuth();
  const auth = { token: accessToken, refreshAccessToken };
  const [documents, setDocuments] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [decks, setDecks] = useState([]);
  const [deck, setDeck] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [selectedWebsites, setSelectedWebsites] = useState([]);
  const [cardCount, setCardCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [docs, web, saved] = await Promise.all([documentApi.list(auth), sourceApi.list(auth), flashcardApi.list(auth)]);
      setDocuments(docs.items); setWebsites(web.items); setDecks(saved.items);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [accessToken, refreshAccessToken]);
  useEffect(() => { load(); }, [load]);

  async function generate(event) {
    event.preventDefault(); if (working) return;
    setWorking(true); setError(''); setNotice('');
    try {
      const response = await flashcardApi.generate({ documentIds: selectedDocuments, websiteSourceIds: selectedWebsites, cardCount }, auth);
      setDeck(response.item); setCardIndex(0); setShowAnswer(false);
      setDecks(items => [response.item, ...items.filter(item => item.id !== response.item.id)]);
    } catch (e) { setError(e.message); }
    finally { setWorking(false); }
  }

  function openDeck(item) { setDeck(item); setCardIndex(0); setShowAnswer(false); setError(''); setNotice(''); }
  function moveCard(offset) { setCardIndex(index => Math.max(0, Math.min(deck.cards.length - 1, index + offset))); setShowAnswer(false); }
  function closeDeck() { setDeck(null); setCardIndex(0); setShowAnswer(false); setError(''); }

  async function deleteDeck(item) {
    if (!window.confirm(`Delete “${item.title}”? This removes the saved flashcards.`)) return;
    setWorking(true); setError(''); setNotice('');
    try { await flashcardApi.remove(item.id, auth); setDecks(current => current.filter(deckItem => deckItem.id !== item.id)); if (deck?.id === item.id) setDeck(null); setNotice('Flashcard deck deleted.'); }
    catch (e) { setError(e.message); }
    finally { setWorking(false); }
  }

  const toggle = (values, setValues, id) => setValues(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const currentCard = deck?.cards[cardIndex];

  return <WorkspaceShell active="flashcards"><div className="flashcards-page">
    <div className="documents-heading"><div><p className="eyebrow"><Layers2 size={13} /> ACTIVE RECALL</p><h1>{deck ? deck.title : 'Flashcards'}</h1><p>{deck ? `Practice ${deck.cards.length} cards${deck.sourceNames.length ? ` from ${deck.sourceNames.join(', ')}` : ''}.` : 'Turn your study sources into short question-and-answer cards.'}</p></div>{deck && <button className="quiz-back-button" onClick={closeDeck}><ArrowLeft size={15} /> All decks</button>}</div>
    {error && <p className="quiz-feedback error" role="alert">{error}</p>}{notice && <p className="note-feedback success" role="status">{notice}</p>}
    {deck && currentCard ? <section className="flashcard-study" aria-label="Flashcard review"><div className="flashcard-study-top"><span>Card {cardIndex + 1} of {deck.cards.length}</span><span>{showAnswer ? 'Answer' : 'Question'}</span></div><button className={`study-flashcard ${showAnswer ? 'answer' : ''}`} onClick={() => setShowAnswer(value => !value)} aria-label={showAnswer ? 'Show question' : 'Reveal answer'} aria-live="polite"><span className="flashcard-face-label">{showAnswer ? 'ANSWER' : 'QUESTION'}</span><span className="flashcard-face-text">{showAnswer ? currentCard.back : currentCard.front}</span><small><RotateCcw size={13} /> Click to {showAnswer ? 'see question' : 'reveal answer'}</small></button><div className="flashcard-controls"><button onClick={() => moveCard(-1)} disabled={cardIndex === 0}><ArrowLeft size={15} /> Previous</button><button className="button button-primary" onClick={() => setShowAnswer(value => !value)}>{showAnswer ? 'Show question' : 'Reveal answer'}</button><button onClick={() => moveCard(1)} disabled={cardIndex === deck.cards.length - 1}>Next <ArrowRight size={15} /></button></div></section> : <div className="flashcards-builder-layout"><form className="quiz-builder" onSubmit={generate}><h2><Sparkles size={17} /> Create flashcards</h2><p>Choose sources, or leave them unchecked to use all your study material.</p><label className="flashcard-count-label">Number of cards<select value={cardCount} onChange={event => setCardCount(Number(event.target.value))}><option value={5}>5 cards</option><option value={10}>10 cards</option><option value={15}>15 cards</option><option value={20}>20 cards</option></select></label><div className="quiz-source-pickers"><h3>Your study sources</h3>{loading ? <span className="quiz-loading"><LoaderCircle size={15} className="spin" /> Loading sources…</span> : <>{documents.map(document => <label key={document.id}><input type="checkbox" checked={selectedDocuments.includes(document.id)} onChange={() => toggle(selectedDocuments, setSelectedDocuments, document.id)} /><FileText size={15} /><span>{document.displayName}</span></label>)}{websites.map(source => <label key={source.id}><input type="checkbox" checked={selectedWebsites.includes(source.id)} onChange={() => toggle(selectedWebsites, setSelectedWebsites, source.id)} /><Globe2 size={15} /><span>{source.title}</span></label>)}{!documents.length && !websites.length && <p>Add documents or webpages before creating flashcards.</p>}</>}</div><button className="button button-primary quiz-generate-button" type="submit" disabled={working || loading || (!documents.length && !websites.length)}>{working ? <><LoaderCircle size={15} className="spin" /> Generating…</> : <><Sparkles size={15} /> Generate flashcards</>}</button><small>Generation uses the Ollama model configured on your StudyRAG server.</small></form><section className="quiz-saved"><div className="quiz-saved-heading"><h2>Saved decks</h2><span>{decks.length}</span></div>{loading ? <div className="quiz-loading"><LoaderCircle size={16} className="spin" /> Loading…</div> : decks.length ? decks.map(item => <article className="flashcard-deck-row" key={item.id}><button className="quiz-saved-item" onClick={() => openDeck(item)}><span><BookOpenCheck size={17} /></span><span><b>{item.title}</b><small>{item.cardCount} cards · {item.sourceNames.join(', ')}</small></span><ArrowRight size={15} /></button><button className="flashcard-delete-button" onClick={() => deleteDeck(item)} disabled={working} aria-label={`Delete ${item.title}`}><Trash2 size={14} /></button></article>) : <div className="quiz-empty">Your saved decks will appear here.</div>}</section></div>}
  </div></WorkspaceShell>;
}
