import { useEffect, useState } from 'react';
import { Camera, Download, KeyRound, LoaderCircle, Save, ShieldCheck, Trash2, UserRound } from 'lucide-react';
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
  const profileImageKey = user?.email ? `studyrag:profile-image:${user.email.toLowerCase()}` : '';
  const [profileImage, setProfileImage] = useState(() => profileImageKey ? window.localStorage.getItem(profileImageKey) || '' : '');
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    setProfileImage(profileImageKey ? window.localStorage.getItem(profileImageKey) || '' : '');
  }, [profileImageKey]);

  async function saveProfileImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setProfileError(''); setProfileNotice('');
    if (!file.type.startsWith('image/')) { setProfileError('Choose an image file.'); return; }
    if (file.size > 8 * 1024 * 1024) { setProfileError('Choose an image smaller than 8 MB.'); return; }
    let imageUrl = '';
    try {
      imageUrl = URL.createObjectURL(file);
      const source = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('This image could not be opened.'));
        image.src = imageUrl;
      });
      URL.revokeObjectURL(imageUrl);
      imageUrl = '';
      const scale = Math.min(1, 320 / Math.max(source.width, source.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(source.width * scale));
      canvas.height = Math.max(1, Math.round(source.height * scale));
      canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', .82);
      window.localStorage.setItem(profileImageKey, data);
      setProfileImage(data);
      window.dispatchEvent(new Event('studyrag:profile-image-updated'));
      setProfileNotice('Your profile photo has been updated.');
    } catch (imageError) {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setProfileError(imageError.name === 'QuotaExceededError' ? 'There is not enough browser storage for this photo.' : imageError.message);
    }
  }

  function removeProfileImage() {
    if (profileImageKey) window.localStorage.removeItem(profileImageKey);
    setProfileImage('');
    window.dispatchEvent(new Event('studyrag:profile-image-updated'));
    setProfileNotice('Your profile photo was removed.');
  }

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

  async function downloadExport() {
    setExportBusy(true); setExportError('');
    const submit = token => fetch('/api/v1/auth/export', { credentials: 'include', headers: { Authorization: `Bearer ${token}` } });
    try {
      let response = await submit(accessToken);
      if (response.status === 401) response = await submit(await refreshAccessToken());
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error?.message || 'Your data export could not be prepared.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `studyrag-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch (e) { setExportError(e.message); }
    finally { setExportBusy(false); }
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
      <div className="profile-photo-row"><span className="profile-photo-preview">{profileImage ? <img src={profileImage} alt="Your profile" /> : user?.displayName?.slice(0, 1)?.toUpperCase() || <UserRound size={22} />}</span><div><b>Profile photo</b><small>Shown in the top corner. JPEG or PNG, up to 8 MB.</small><div className="profile-photo-actions"><label className="button button-secondary"><Camera size={15} />{profileImage ? 'Change photo' : 'Upload photo'}<input type="file" accept="image/*" onChange={saveProfileImage} /></label>{profileImage && <button type="button" className="button button-secondary" onClick={removeProfileImage}><Trash2 size={14} /> Remove</button>}</div></div></div>
      <form className="settings-password-form" onSubmit={saveProfile}><label>Display name<input value={profileName} onChange={event => setProfileName(event.target.value)} minLength={2} maxLength={80} autoComplete="name" required /></label><button className="button button-primary" disabled={profileBusy || profileName.trim() === user?.displayName}>{profileBusy ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />}{profileBusy ? 'Saving…' : 'Save profile'}</button></form>
      <dl className="settings-profile"><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>Account type</dt><dd>{user?.role}</dd></div></dl>
    </section>
    <section className="settings-card"><header><span><KeyRound size={18} /></span><div><h2>Change password</h2><p>Changing your password signs out all active sessions.</p></div></header>
      {error && <p className="note-feedback error" role="alert">{error}</p>}{notice && <p className="note-feedback success" role="status">{notice}</p>}
      <form className="settings-password-form" onSubmit={changePassword}><label>Current password<input name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required /></label><label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /><small>At least 10 characters.</small></label><label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /></label><button className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <KeyRound size={15} />}{busy ? 'Updating…' : 'Update password'}</button></form>
    </section>
    <section className="settings-card"><header><span><Download size={18} /></span><div><h2>Export your data</h2><p>Download your StudyRAG records and extracted study text as a private JSON file.</p></div></header>
      <p className="settings-export-detail">The export leaves out password credentials, sessions, original uploaded files, and internal storage details.</p>
      {exportError && <p className="note-feedback error" role="alert">{exportError}</p>}
      <button className="button button-primary" onClick={downloadExport} disabled={exportBusy}>{exportBusy ? <LoaderCircle className="spin" size={15} /> : <Download size={15} />}{exportBusy ? 'Preparing export…' : 'Download my data'}</button>
    </section>
  </div></WorkspaceShell>;
}
