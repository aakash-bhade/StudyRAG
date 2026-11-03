import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, LoaderCircle, MailCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { authApi } from '../../services/authApi.js';

export default function EmailActionPage({ mode }) {
  const location = useLocation();
  const [email, setEmail] = useState(() => new URLSearchParams(location.search).get('email') || '');
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (mode === 'reset') window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    if (mode === 'reset' && !token) setError('This reset link is incomplete. Request a new one to continue.');
  }, [mode, token]);

  useEffect(() => {
    if (mode === 'verify' || mode === 'reset') window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    if (mode === 'verify' && !token) setError('This verification link is incomplete. Request a new one below.');
    if (mode === 'reset' && !token) setError('This reset link is incomplete. Request a new one to continue.');
  }, [mode, token]);

  async function confirmEmail() {
    setBusy(true); setError('');
    try { await authApi.verifyEmail(token); setVerified(true); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function requestLink(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'pending' || mode === 'verify') await authApi.requestVerification(email.trim());
      else await authApi.requestPasswordReset(email.trim());
      setNotice('If an eligible account matches that email, a link will arrive shortly. Check your inbox and spam folder.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function resetPassword(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    const form = new FormData(event.currentTarget);
    const newPassword = form.get('newPassword');
    if (newPassword !== form.get('confirmPassword')) { setError('New passwords do not match.'); setBusy(false); return; }
    try { await authApi.resetPassword({ token, newPassword }); setNotice('Your password was changed. Sign in with your new password.'); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const title = mode === 'pending' ? 'Check your inbox.' : mode === 'verify' ? verified ? 'Email verified.' : 'Verify your email.' : mode === 'forgot' ? 'Reset your password.' : 'Choose a new password.';
  const subtitle = mode === 'pending' ? 'We sent a secure verification link if email delivery is configured.' : mode === 'verify' ? verified ? 'Your StudyRAG account is ready to use.' : 'Confirm the email address linked to your account.' : mode === 'forgot' ? 'We’ll email a reset link if an eligible account matches.' : 'Choose a new password for your StudyRAG account.';

  return <main className="auth-screen"><div className="auth-sky" aria-hidden="true"><span /><span /><span /></div><Link className="auth-back" to="/login"><ArrowLeft size={16} /> Back to sign in</Link>
    <section className="auth-card" aria-labelledby="email-action-heading"><Link className="auth-brand" to="/" aria-label="StudyRAG home"><span><GraduationCap size={26} /></span><b>Study<span>RAG</span></b></Link>
      <div className="auth-heading"><span className="auth-spark">{verified || notice ? <CheckCircle2 size={18} /> : mode === 'verify' || mode === 'pending' ? <MailCheck size={18} /> : <Sparkles size={18} />}</span><p className="eyebrow">ACCOUNT SECURITY</p><h1 id="email-action-heading">{title}</h1><p>{subtitle}</p></div>
      {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="auth-success" role="status">{notice}</p>}
      {mode === 'reset' && token && !notice && <form className="auth-form" onSubmit={resetPassword}><label htmlFor="newPassword">New password</label><input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} placeholder="At least 10 characters" required /><label htmlFor="confirmPassword">Confirm new password</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /><button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Saving…' : 'Update password'}{!busy && <ArrowRight size={17} />}</button></form>}
      {mode === 'verify' && token && !verified && <button className="button button-primary auth-submit" onClick={confirmEmail} disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <MailCheck size={16} />}{busy ? 'Verifying…' : 'Confirm email address'}<ArrowRight size={16} /></button>}
      {(mode === 'forgot' || mode === 'pending' || (mode === 'verify' && (!token || error))) && <form className="auth-form" onSubmit={requestLink}><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" maxLength={254} required /><button className="button button-primary auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : mode === 'pending' ? <MailCheck size={16} /> : <ArrowRight size={16} />}{busy ? 'Please wait…' : mode === 'pending' || mode === 'verify' ? 'Resend verification link' : 'Send reset link'}</button></form>}
      {mode === 'reset' && <Link className="auth-inline-link" to="/forgot-password">Request a fresh reset link</Link>}
      {mode === 'verify' && verified && <div className="auth-note"><ShieldCheck size={15} /><span>Email address confirmed.</span></div>}
      <p className="auth-switch"><Link to="/login">Return to sign in</Link></p>
    </section><div className="auth-side-note"><ShieldCheck size={15} /> Secure links expire and can only be used once</div>
  </main>;
}
