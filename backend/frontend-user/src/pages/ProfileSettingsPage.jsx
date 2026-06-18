import { useState } from 'react';

import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ProfileSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }

    if (newPassword && newPassword.length < 8) {
      addToast('New password must be at least 8 characters', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const body = { name };
      if (currentPassword && newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      const res = await client.put('/api/user/profile', body);
      updateUser({ ...user, name: res.data.user.name });
      addToast('Profile updated', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card card--padded" style={{ width: 'min(520px, 100%)' }}>
      <h2 className="card-title">Profile settings</h2>
      <p className="muted" style={{ margin: '0.2rem 0 0.6rem', fontSize: '0.75rem' }}>{user?.email}</p>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.4rem 0' }} />
        <p className="muted" style={{ fontSize: '0.75rem', margin: 0 }}>Change password (optional)</p>
        <label>
          Current password
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Leave blank to keep same" />
        </label>
        <label>
          New password
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
        </label>
        <label>
          Confirm new password
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
        </label>
        <button type="submit" disabled={submitting} className={submitting ? 'btn-loading' : ''}>
          {submitting ? 'Saving' : 'Save changes'}
        </button>
      </form>
    </section>
  );
};

export default ProfileSettingsPage;
