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
        setError('This portal is only for admin users.');
        setSubmitting(false);
        return;
      }
      login(response.data.token, response.data.user);
      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to sign in. Check credentials and try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card card--padded auth-card">
      <h2>Admin Login</h2>
      <p className="muted">Sign in with your admin credentials to monitor SOS alerts.</p>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="admin@example.com" />
        </label>
        <label>
          Password
          <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Password" />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Login'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
    </section>
  );
};

export default LoginPage;
