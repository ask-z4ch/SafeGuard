import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

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
      login(response.data.token, response.data.user);
      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card card--padded">
      <h2>Login</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" name="email" value={form.email} required onChange={handleChange} placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input type="password" name="password" value={form.password} required onChange={handleChange} placeholder="Your password" />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Login'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      <p className="muted">
        Need an account? <Link to="/register">Register</Link>
      </p>
    </section>
  );
};

export default LoginPage;
