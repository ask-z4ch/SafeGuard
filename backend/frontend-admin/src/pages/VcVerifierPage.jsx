import { useState } from 'react';

import client from '../api/client';

const VcVerifierPage = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    setError(null);
    setResult(null);
    if (!input.trim()) {
      setError('Paste a hash or VC JSON to verify');
      return;
    }

    setLoading(true);
    try {
      let body;
      if (input.trim().startsWith('{')) {
        body = { credential: JSON.parse(input.trim()) };
      } else {
        body = { hash: input.trim() };
      }
      const res = await client.post('/api/verify-vc', body);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card card--padded" style={{ width: 'min(720px, 100%)' }}>
      <header className="dashboard-header">
        <h2>Credential verifier</h2>
      </header>
      <p className="muted" style={{ margin: '0.2rem 0 0.8rem', fontSize: '0.75rem' }}>
        Paste a VC hash or full credential JSON to verify its on-chain anchor.
      </p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste hash (64 hex chars) or VC JSON here..."
        rows={5}
        style={{
          width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)',
          background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)',
          resize: 'vertical',
        }}
      />

      <button type="button" onClick={handleVerify} disabled={loading} style={{ marginTop: '0.6rem' }}>
        {loading ? 'Verifying...' : 'Verify'}
      </button>

      {error && <div className="error">{error}</div>}

      {result && (
        <div style={{ marginTop: '0.8rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span className={`tag ${result.verified ? 'success' : 'danger'}`}>
              {result.verified ? 'verified' : 'not found'}
            </span>
            {result.onChain?.exists && <span className="tag success">on-chain</span>}
          </div>
          {result.record && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
              <div>Issuer: {result.record.issuerDid}</div>
              <div>Subject: {result.record.credentialSubject?.name}</div>
              <div>Issued: {new Date(result.record.issuedAt).toLocaleString()}</div>
            </div>
          )}
          <pre className="vc-preview">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </section>
  );
};

export default VcVerifierPage;
