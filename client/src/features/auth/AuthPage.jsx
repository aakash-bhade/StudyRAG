import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Eye, EyeOff, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const roles = [
  ['student', 'Student'],
  ['teacher', 'Teacher / educator'],
  ['employee', 'Employee'],
  ['business', 'Business professional'],
];

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setNeedsVerification(false);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const details = Object.fromEntries(form.entries());
    try {
      if (isSignup) {
        const result = await register(details);
        if (result.verificationRequired) {
          navigate(`/verify-email/pending?email=${encodeURIComponent(result.email)}`, { replace: true });
          return;
        }
      }
      else await login({ email: details.email, password: details.password });
      navigate('/app', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
      setNeedsVerification(requestError.code === 'EMAIL_NOT_VERIFIED');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-screen">
    <div className="auth-sky" aria-hidden="true"><span /><span /><span /></div>
    <Link className="auth-back" to="/"><ArrowLeft size={16} /> Back to StudyRAG</Link>
    <section className="auth-card" aria-labelledby="auth-heading">
      <Link className="auth-brand" to="/" aria-label="StudyRAG home"><span><GraduationCap size={26} /></span><b>Study<span>RAG</span></b></Link>
      <div className="auth-heading">
        <span className="auth-spark"><Sparkles size={18} /></span>
        <p className="eyebrow">{isSignup ? 'MAKE A LITTLE ROOM TO LEARN' : 'WELCOME BACK'}</p>
        <h1 id="auth-heading">{isSignup ? 'Your ideas belong here.' : 'Good to see you again.'}</h1>
        <p>{isSignup ? 'Create your personal StudyRAG account to get started.' : 'Sign in to continue to your StudyRAG workspace.'}</p>
      </div>
      {location.state?.message && <p className="auth-success" role="status">{location.state.message}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
        {isSignup && <>
          <label htmlFor="displayName">Your name</label>
          <input id="displayName" name="displayName" autoComplete="name" placeholder="e.g. Alex Morgan" minLength={2} maxLength={80} required />
        </>}
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required />
        {isSignup && <>
          <label htmlFor="role">How will you use StudyRAG?</label>
          <select id="role" name="role" defaultValue="student" required>{roles.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
        </>}
        <div className="password-label"><label htmlFor="password">Password</label>{isSignup && <span>At least 10 characters</span>}</div>
        <div className="password-input"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={isSignup ? 10 : undefined} maxLength={128} placeholder={isSignup ? 'Create a strong password' : 'Enter your password'} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {needsVerification && <Link className="auth-inline-link" to="/verify-email/pending">Request a verification link</Link>}
        {!isSignup && <Link className="auth-inline-link auth-forgot-link" to="/forgot-password">Forgot your password?</Link>}
        <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : isSignup ? 'Create your account' : 'Sign in'}{!busy && <ArrowRight size={17} />}</button>
      </form>
      <div className="auth-note"><ShieldCheck size={15} /><span>Your password is protected. We never store it in plain text.</span></div>
      <p className="auth-switch">{isSignup ? 'Already have an account?' : 'New to StudyRAG?'} <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</Link></p>
    </section>
    <div className="auth-side-note"><BookOpen size={15} /> A more thoughtful way to work with what you know</div>
  </main>;
}
