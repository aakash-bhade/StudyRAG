import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, CircleHelp, Download, FileText, Globe2, LoaderCircle, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { documentApi } from '../../services/documentApi.js';
import { sourceApi } from '../../services/sourceApi.js';
import { quizApi } from '../../services/quizApi.js';

export default function QuizzesPage() {
  const { accessToken, refreshAccessToken } = useAuth();
  const auth = { token: accessToken, refreshAccessToken };
  const [documents, setDocuments] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [selectedWebsites, setSelectedWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, web, saved] = await Promise.all([documentApi.list(auth), sourceApi.list(auth), quizApi.list(auth)]);
      setDocuments(docs.items); setWebsites(web.items); setQuizzes(saved.items); setError('');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [accessToken, refreshAccessToken]);
  useEffect(() => { load(); }, [load]);

  async function generate(event) {
    event.preventDefault(); if (working) return;
    setWorking(true); setError(''); setResult(null);
    try {
      const response = await quizApi.generate({ documentIds: selectedDocuments, websiteSourceIds: selectedWebsites, difficulty, questionCount }, auth);
      setQuiz(response.item); setAnswers(Array(response.item.questions.length).fill(null));
      setQuizzes(items => [response.item, ...items.filter(item => item.id !== response.item.id)]);
    } catch (e) { setError(e.message); }
    finally { setWorking(false); }
  }

  async function openQuiz(id) {
    setError(''); setWorking(true); setResult(null);
    try { const response = await quizApi.get(id, auth); setQuiz(response.item); setAnswers(Array(response.item.questions.length).fill(null)); }
    catch (e) { setError(e.message); }
    finally { setWorking(false); }
  }

  async function deleteQuiz(item) {
    if (!window.confirm(`Delete “${item.title}” and its saved attempts? This cannot be undone.`)) return;
    setDeletingId(item.id); setError('');
    try {
      await quizApi.delete(item.id, auth);
      setQuizzes(items => items.filter(quizItem => quizItem.id !== item.id));
    } catch (e) { setError(e.message); }
    finally { setDeletingId(''); }
  }

  async function submit(event) {
    event.preventDefault(); if (!quiz || working) return;
    setWorking(true); setError('');
    try { const response = await quizApi.submit(quiz.id, answers, auth); setResult(response.item); }
    catch (e) { setError(e.message); }
    finally { setWorking(false); }
  }

  function returnToBuilder() { setQuiz(null); setResult(null); setAnswers([]); setError(''); }
  const toggle = (values, setValues, id) => setValues(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);

  return <WorkspaceShell active="quizzes"><div className="quiz-page">
    <div className="quiz-page-heading"><div><h1>MCQ Generator</h1></div></div>
    {error && <p className="quiz-feedback error" role="alert">{error}</p>}
    <div className="quiz-workspace-layout">
      <aside className="quiz-settings-column">
        <form className="quiz-builder" onSubmit={generate}>
          <div className="quiz-source-pickers">
            <h3>Select source</h3>
            {loading ? <span className="quiz-loading"><LoaderCircle size={15} className="spin" /> Loading sources…</span> : <>
              {documents.map(doc => <label className={selectedDocuments.includes(doc.id) ? 'selected' : ''} key={doc.id}><input type="checkbox" checked={selectedDocuments.includes(doc.id)} onChange={() => toggle(selectedDocuments, setSelectedDocuments, doc.id)} /><FileText size={16} /><span>{doc.displayName}</span></label>)}
              {websites.map(source => <label className={selectedWebsites.includes(source.id) ? 'selected' : ''} key={source.id}><input type="checkbox" checked={selectedWebsites.includes(source.id)} onChange={() => toggle(selectedWebsites, setSelectedWebsites, source.id)} /><Globe2 size={16} /><span>{source.title}</span></label>)}
              {!documents.length && !websites.length && <p>Add a document or website to generate a quiz.</p>}
            </>}
          </div>
          <div className="quiz-controls">
            <label>Number of questions<select value={questionCount} onChange={event => setQuestionCount(Number(event.target.value))}><option value={3}>3 questions</option><option value={5}>5 questions</option><option value={10}>10 questions</option></select></label>
            <fieldset className="quiz-difficulty"><legend>Difficulty level</legend><div>{[['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']].map(([value, label]) => <label className={difficulty === value ? 'active' : ''} key={value}><input type="radio" name="quiz-difficulty" value={value} checked={difficulty === value} onChange={() => setDifficulty(value)} />{label}</label>)}</div></fieldset>
          </div>
          <button className="button button-primary quiz-generate-button" type="submit" disabled={working || loading || (!documents.length && !websites.length)}>{working ? <><LoaderCircle size={15} className="spin" /> Generating…</> : <><Sparkles size={15} /> Generate MCQs</>}</button>
        </form>
        <section className="quiz-saved">
          <div className="quiz-saved-heading"><h2>Saved quizzes</h2><span>{quizzes.length}</span></div>
          {loading ? <div className="quiz-loading"><LoaderCircle size={16} className="spin" /> Loading…</div> : quizzes.length ? quizzes.map(item => <article className={`quiz-saved-row ${quiz?.id === item.id ? 'current' : ''}`} key={item.id}><button className="quiz-saved-item" onClick={() => openQuiz(item.id)} disabled={Boolean(deletingId)}><span><CircleHelp size={17} /></span><span><b>{item.title}</b><small>{item.questionCount} questions · {item.difficulty}</small></span><ArrowLeft size={15} className="quiz-open-arrow" /></button><button className="quiz-delete-button" onClick={() => deleteQuiz(item)} disabled={Boolean(deletingId)} aria-label={`Delete ${item.title}`} title="Delete quiz">{deletingId === item.id ? <LoaderCircle size={15} className="spin" /> : <Trash2 size={15} />}</button></article>) : <div className="quiz-empty">Your saved quizzes will appear here.</div>}
        </section>
      </aside>
      <section className="quiz-results-column" aria-live="polite">
        {quiz ? <form className="quiz-take" onSubmit={submit}>
          <header className="quiz-results-heading"><div><p className="eyebrow">GENERATED MCQS</p><h2>{quiz.title}</h2><p>{quiz.questions.length} questions · {quiz.difficulty} difficulty</p></div><div className="quiz-results-badges"><button className="quiz-pdf-button" type="button" onClick={() => window.print()}><Download size={14} /> Download PDF</button><span>{quiz.sourceNames.join(', ')}</span>{result && <b>{result.score} / {result.total} · {result.percentage}%</b>}<button className="quiz-back-button" type="button" onClick={returnToBuilder}><ArrowLeft size={14} /> Clear</button></div></header>
          <div className="quiz-questions-list">{quiz.questions.map((question, index) => <article className="quiz-question" key={index}><div className="quiz-question-title"><span>{index + 1}</span><h3>{question.prompt}</h3></div><div className="quiz-options">{question.options.map((option, choice) => { const review = result?.answers[index]; const state = review ? (choice === review.correctIndex ? ' correct' : choice === review.selectedIndex ? ' incorrect' : '') : ''; return <label className={`quiz-option${answers[index] === choice ? ' selected' : ''}${state}`} key={choice}><input type="radio" name={`question-${index}`} checked={answers[index] === choice} disabled={Boolean(result) || working} onChange={() => setAnswers(current => current.map((value, i) => i === index ? choice : value))} /><span className="quiz-option-letter">{String.fromCharCode(65 + choice)}</span><span>{option}</span>{review && choice === review.correctIndex && <Check size={16} />}</label>; })}</div>{result && <div className={`quiz-explanation ${result.answers[index].isCorrect ? 'good' : 'needs-review'}`}>{result.answers[index].explanation}{question.sourceNames?.length ? <small>Source: {question.sourceNames.join(', ')}</small> : null}</div>}</article>)}</div>
          {result ? <button className="quiz-submit-button" type="button" onClick={() => { setResult(null); setAnswers(Array(quiz.questions.length).fill(null)); }}><RotateCcw size={15} /> Try again</button> : <button className="quiz-submit-button" type="submit" disabled={working || answers.some(answer => answer === null)}>{working ? <><LoaderCircle size={15} className="spin" /> Scoring…</> : 'Submit answers'}</button>}
        </form> : <section className="quiz-results-empty"><div className="quiz-results-heading"><div><p className="eyebrow">YOUR PRACTICE SPACE</p><h2>Generated MCQs</h2></div></div><div className="quiz-empty-prompt"><span><CircleHelp size={26} /></span><h3>Ready when you are</h3><div className="quiz-empty-steps"><span><FileText size={16} /> Pick a source</span><span><Sparkles size={16} /> Generate questions</span><span><Check size={16} /> Check your answers</span></div></div></section>}
      </section>
    </div>
  </div></WorkspaceShell>;
}
