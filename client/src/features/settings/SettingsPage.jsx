import { useState } from 'react';
import { KeyRound, LoaderCircle, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkspaceShell from '../dashboard/WorkspaceShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function SettingsPage() {
  const { user, accessToken, refreshAccessToken, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const [profileName, setProfileName] = useState(user?.displayName || '');
  const [profileBusy, setProfileBusy] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    setProfileBusy(true); setProfileError(''); setProfileNotice('');
    const submit = token => fetch('/api/v1/auth/profile', { method: 'PATCH', credentials: 'include', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: profileName.trim() }) });
    try {
      let response = await submit(accessToken);
      if (response.status === 401) response = await submit(await refreshAccessToken());
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error?.message || 'Profile could not be updated.');
      updateUser(result.user);
      setProfileName(result.user.displayName);
      setProfileNotice('Your profile name has been updated.');
    } catch (e) { setProfileError(e.message); }
    finally { setProfileBusy(false); }
  }

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
    <section className="settings-card"><header><span><UserRound size={18} /></span><div><h2>Account profile</h2><p>Update how your name appears across StudyRAG.</p></div></header>
      {profileError && <p className="note-feedback error" role="alert">{profileError}</p>}{profileNotice && <p className="note-feedback success" role="status">{profileNotice}</p>}
      <form className="settings-password-form" onSubmit={saveProfile}><label>Display name<input value={profileName} onChange={event => setProfileName(event.target.value)} minLength={2} maxLength={80} autoComplete="name" required /></label><button className="button button-primary" disabled={profileBusy || profileName.trim() === user?.displayName}>{profileBusy ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />}{profileBusy ? 'Saving…' : 'Save profile'}</button></form>
      <dl className="settings-profile"><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>Account type</dt><dd>{user?.role}</dd></div></dl>
    </section>
    <section className="settings-card"><header><span><KeyRound size={18} /></span><div><h2>Change password</h2><p>Changing your password signs out all active sessions.</p></div></header>
      {error && <p className="note-feedback error" role="alert">{error}</p>}{notice && <p className="note-feedback success" role="status">{notice}</p>}
      <form className="settings-password-form" onSubmit={changePassword}><label>Current password<input name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required /></label><label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /><small>At least 10 characters.</small></label><label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /></label><button className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <KeyRound size={15} />}{busy ? 'Updating…' : 'Update password'}</button></form>
    </section>
  </div></WorkspaceShell>;
}
