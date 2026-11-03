import { useState } from 'react';
import { KeyRound, LoaderCircle, ShieldCheck, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function SettingsPage() {
  const { user, accessToken, refreshAccessToken, logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function changePassword(event) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    const form = new FormData(event.currentTarget);
    const payload = { currentPassword: form.get('currentPassword'), newPassword: form.get('newPassword') };
    if (payload.newPassword !== form.get('confirmPassword')) { setError('New passwords do not match.'); setBusy(false); return; }
    try {
      let response = await fetch('/api/v1/auth/password', { method: 'PATCH', credentials: 'include', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (response.status === 401) {
        const token = await refreshAccessToken();
        response = await fetch('/api/v1/auth/password', { method: 'PATCH', credentials: 'include', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error?.message || 'Password could not be changed.');
      await logout();
      navigate('/login', { replace: true, state: { message: 'Password changed. Please sign in with your new password.' } });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return <WorkspaceShell active="settings"><div className="settings-page">
    <div className="documents-heading"><div><p className="eyebrow"><ShieldCheck size={13} /> ACCOUNT & SECURITY</p><h1>Settings</h1><p>Manage your account details and keep your sign-in secure.</p></div></div>
    <section className="settings-card"><header><span><UserRound size={18} /></span><div><h2>Account profile</h2><p>Your StudyRAG account information</p></div></header><dl className="settings-profile"><div><dt>Name</dt><dd>{user?.displayName}</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>Account type</dt><dd>{user?.role}</dd></div></dl></section>
    <section className="settings-card"><header><span><KeyRound size={18} /></span><div><h2>Change password</h2><p>Changing your password signs out all active sessions.</p></div></header>
      {error && <p className="note-feedback error" role="alert">{error}</p>}{notice && <p className="note-feedback success" role="status">{notice}</p>}
      <form className="settings-password-form" onSubmit={changePassword}><label>Current password<input name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required /></label><label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /><small>At least 10 characters.</small></label><label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /></label><button className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <KeyRound size={15} />}{busy ? 'Updating…' : 'Update password'}</button></form>
    </section>
  </div></WorkspaceShell>;
}
