import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, CircleHelp, FileText, Globe2, LoaderCircle, RotateCcw, Sparkles } from 'lucide-react';
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
    <div className="documents-heading"><div><p className="eyebrow"><Sparkles size={13} /> ACTIVE RECALL</p><h1>{quiz ? quiz.title : 'Study quizzes'}</h1><p>{quiz ? `${quiz.questions.length} questions · ${quiz.difficulty} difficulty · ${quiz.sourceNames.join(', ')}` : 'Practice with multiple-choice quizzes grounded in your own sources.'}</p></div>{quiz && <button className="quiz-back-button" onClick={returnToBuilder}><ArrowLeft size={15} /> All quizzes</button>}</div>
    {error && <p className="quiz-feedback error" role="alert">{error}</p>}
    {!quiz ? <div className="quiz-builder-layout"><form className="quiz-builder" onSubmit={generate}><h2><Sparkles size={17} /> Create a quiz</h2><p>Choose sources below, or leave them unchecked to use all your material.</p><div className="quiz-controls"><label>Difficulty<select value={difficulty} onChange={event => setDifficulty(event.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label><label>Questions<select value={questionCount} onChange={event => setQuestionCount(Number(event.target.value))}><option value={3}>3 questions</option><option value={5}>5 questions</option><option value={10}>10 questions</option></select></label></div><div className="quiz-source-pickers"><h3>Your study sources</h3>{loading ? <span className="quiz-loading"><LoaderCircle size={15} className="spin" /> Loading sources…</span> : <>{documents.map(doc => <label key={doc.id}><input type="checkbox" checked={selectedDocuments.includes(doc.id)} onChange={() => toggle(selectedDocuments, setSelectedDocuments, doc.id)} /><FileText size={15} /><span>{doc.displayName}</span></label>)}{websites.map(source => <label key={source.id}><input type="checkbox" checked={selectedWebsites.includes(source.id)} onChange={() => toggle(selectedWebsites, setSelectedWebsites, source.id)} /><Globe2 size={15} /><span>{source.title}</span></label>)}{!documents.length && !websites.length && <p>Add documents or webpages before creating a quiz.</p>}</>}</div><button className="button button-primary quiz-generate-button" type="submit" disabled={working || loading || (!documents.length && !websites.length)}>{working ? <><LoaderCircle size={15} className="spin" /> Generating…</> : <><Sparkles size={15} /> Generate quiz</>}</button><small>Quiz generation uses the Ollama model configured on your StudyRAG server.</small></form><section className="quiz-saved"><div className="quiz-saved-heading"><h2>Saved quizzes</h2><span>{quizzes.length}</span></div>{loading ? <div className="quiz-loading"><LoaderCircle size={16} className="spin" /> Loading…</div> : quizzes.length ? quizzes.map(item => <button className="quiz-saved-item" key={item.id} onClick={() => openQuiz(item.id)}><span><CircleHelp size={17} /></span><span><b>{item.title}</b><small>{item.questionCount} questions · {item.difficulty}</small></span><ArrowLeft size={15} className="quiz-open-arrow" /></button>) : <div className="quiz-empty">Your saved quizzes will appear here.</div>}</section></div> : <form className="quiz-take" onSubmit={submit}><div className="quiz-take-top"><span>{quiz.questions.length} questions</span>{result ? <b>{result.score} / {result.total} correct · {result.percentage}%</b> : <span>Choose one answer per question</span>}</div>{quiz.questions.map((question, index) => <article className="quiz-question" key={index}><div className="quiz-question-title"><span>{index + 1}</span><h2>{question.prompt}</h2></div><div className="quiz-options">{question.options.map((option, choice) => { const review = result?.answers[index]; const state = review ? (choice === review.correctIndex ? ' correct' : choice === review.selectedIndex ? ' incorrect' : '') : ''; return <label className={`quiz-option${answers[index] === choice ? ' selected' : ''}${state}`} key={choice}><input type="radio" name={`question-${index}`} checked={answers[index] === choice} disabled={Boolean(result) || working} onChange={() => setAnswers(current => current.map((value, i) => i === index ? choice : value))} /><span className="quiz-option-letter">{String.fromCharCode(65 + choice)}</span><span>{option}</span>{review && choice === review.correctIndex && <Check size={15} />}</label>; })}</div>{result && <div className={`quiz-explanation ${result.answers[index].isCorrect ? 'good' : 'needs-review'}`}>{result.answers[index].explanation}{question.sourceNames?.length ? <small>Source: {question.sourceNames.join(', ')}</small> : null}</div>}</article>)}{result ? <button className="quiz-submit-button" type="button" onClick={() => { setResult(null); setAnswers(Array(quiz.questions.length).fill(null)); }}><RotateCcw size={15} /> Try again</button> : <button className="quiz-submit-button" type="submit" disabled={working || answers.some(answer => answer === null)}>{working ? <><LoaderCircle size={15} className="spin" /> Scoring…</> : 'Submit answers'}</button>}</form>}
  </div></WorkspaceShell>;
}
