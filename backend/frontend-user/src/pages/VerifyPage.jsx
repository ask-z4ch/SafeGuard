import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import client from '../api/client';

const VerifyPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('Provide your verification link to confirm your account.');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('idle');
      setMessage('Missing verification token. Please use the link from your email.');
      return;
    }

    const verify = async () => {
      setStatus('loading');
      try {
        const response = await client.get(`/api/auth/verify?token=${encodeURIComponent(token)}`);
        setStatus('success');
        setMessage(response?.data?.message || 'Email verified successfully. You can log in now.');
      } catch (err) {
        const msg = err.response?.data?.message || 'Could not verify email. The link may have expired.';
        setStatus('error');
        setMessage(msg);
      }
    };

    verify();
  }, [searchParams]);

  return (
    <section className="card card--padded">
      <h2>Email Verification</h2>
      <p className={status === 'error' ? 'error' : status === 'success' ? 'success' : 'muted'}>{message}</p>
    </section>
  );
};

export default VerifyPage;
