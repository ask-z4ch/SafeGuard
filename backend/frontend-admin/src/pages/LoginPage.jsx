import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await client.post('/api/auth/login', form);
      if (response.data?.user?.role !== 'admin') {
        setError('Access denied. Admin credentials required.');
        setSubmitting(false);
        return;
      }
      login(response.data.token, response.data.user);
      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card card--padded auth-card">
      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 600, color: '#e8edf4' }}>Admin sign-in</h2>
      <p className="muted" style={{ margin: '0 0 1rem', fontSize: '0.75rem' }}>Authorized personnel only.</p>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="admin@example.com" autoFocus />
        </label>
        <label>
          Password
          <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;" />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Authenticating...' : 'Sign in'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
    </section>
  );
};

export default LoginPage;
