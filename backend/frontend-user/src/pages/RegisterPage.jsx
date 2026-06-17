import { useState } from 'react';
import { Link } from 'react-router-dom';

import client from '../api/client';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [isSubmitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await client.post('/api/auth/register', form);
      setMessage(response?.data?.message || 'Registration successful. Check your email for verification.');
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to register right now.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card card--padded">
      <h2>Create your account</h2>
      <p className="muted">Sign up to manage your digital ID and issue SOS alerts.</p>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Name
          <input type="text" name="name" value={form.name} required onChange={handleChange} placeholder="Your full name" />
        </label>
        <label>
          Email
          <input type="email" name="email" value={form.email} required onChange={handleChange} placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input type="password" name="password" value={form.password} minLength={8} required onChange={handleChange} placeholder="Create a strong password" />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
      <p className="muted">
        Already registered? <Link to="/login">Login instead</Link>
      </p>
    </section>
  );
};

export default RegisterPage;
