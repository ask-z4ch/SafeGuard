import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { io } from 'socket.io-client';

import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

const extractIssuer = (credential) => {
  if (!credential) return null;
  return (
    credential.issuer ||
    credential.iss ||
    credential.payload?.issuer ||
    credential.payload?.iss ||
    null
  );
};

const DashboardPage = () => {
  const { token } = useAuth();
  const [sosEvents, setSosEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [hashChecks, setHashChecks] = useState({});
  const [actionState, setActionState] = useState({ verify: null, issue: null, check: null });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [trainingOpen, setTrainingOpen] = useState(false);

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        setLoading(true);
        const response = await client.get('/api/admin/sos');
        setSosEvents(response.data?.items || []);
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load SOS records.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchExisting();
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const socket = io(API_BASE_URL, {
      auth: { token: `Bearer ${token}` }
    });

    socket.on('connect', () => setSocketStatus('connected'));
    socket.on('disconnect', () => setSocketStatus('disconnected'));
    socket.on('connect_error', () => setSocketStatus('error'));

    socket.on('sos', (payload) => {
      setSosEvents((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === payload.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...payload };
          return updated;
        }
        return [payload, ...prev];
      });
    });

    return () => socket.disconnect();
  }, [token]);

  const sortedEvents = useMemo(
    () => [...sosEvents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [sosEvents]
  );

  const toggleExpanded = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markVerified = async (userId) => {
    if (!userId) return;
    setActionState((prev) => ({ ...prev, verify: userId }));
    try {
      await client.post('/api/admin/verify-user', { userId });
      setError(null);
      setSosEvents((prev) =>
        prev.map((event) =>
          event.user?.id === userId
            ? { ...event, user: { ...event.user, verified: true } }
            : event
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify user.');
    } finally {
      setActionState((prev) => ({ ...prev, verify: null }));
    }
  };

  const issueCredential = async (userId) => {
    if (!userId) return;
    setActionState((prev) => ({ ...prev, issue: userId }));
    try {
      const response = await client.post(`/api/admin/issue-vc/${userId}`, {});
      const payload = response.data;
      const issuer = extractIssuer(payload.verifiableCredential);
      setError(null);

      setSosEvents((prev) =>
        prev.map((event) =>
          event.user?.id === userId
            ? {
                ...event,
                latestCredential: {
                  id: payload.vcRecordId,
                  hash: payload.hash,
                  transactionHash: payload.anchor?.transactionHash,
                  issuerDid: issuer,
                  createdAt: new Date().toISOString(),
                  verifiableCredential: payload.verifiableCredential
                },
                user: { ...event.user, verified: true }
              }
            : event
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue credential.');
    } finally {
      setActionState((prev) => ({ ...prev, issue: null }));
    }
  };

  const checkHash = async (hash) => {
    if (!hash) return;
    const canonical = hash.startsWith('0x') ? hash.slice(2) : hash;
    setActionState((prev) => ({ ...prev, check: canonical }));
    setHashChecks((prev) => ({ ...prev, [canonical]: { status: 'loading' } }));
    try {
      const response = await client.get(`/api/admin/check-hash/${canonical}`);
      setHashChecks((prev) => ({ ...prev, [canonical]: { status: 'success', data: response.data } }));
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to check hash on chain.';
      setHashChecks((prev) => ({ ...prev, [canonical]: { status: 'error', error: msg } }));
      setError(msg);
    } finally {
      setActionState((prev) => ({ ...prev, check: null }));
    }
  };

  const renderHashStatus = (hash) => {
    if (!hash) return null;
    const canonical = hash.startsWith('0x') ? hash.slice(2) : hash;
    const status = hashChecks[canonical];

    if (!status) return null;
    if (status.status === 'loading') return <span className="tag info">checking</span>;
    if (status.status === 'error') return <span className="tag danger">{status.error}</span>;
    if (status.data?.onChain?.exists) return <span className="tag success">anchored</span>;
    return <span className="tag warning">not found</span>;
  };

  return (
    <section className="dashboard" style={{ width: 'min(1280px, 100%)' }}>
      <div className="card card--padded">
        <header className="dashboard-header">
          <div>
            <h2>SOS feed</h2>
          </div>
          <span className="sos-count">
            {sortedEvents.length} alerts &middot; socket: {socketStatus}
          </span>
        </header>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <p className="muted" style={{ marginTop: '1rem' }}>Loading...</p>
        ) : sortedEvents.length === 0 ? (
          <p className="muted" style={{ marginTop: '1rem' }}>No SOS alerts yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="sos-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Message</th>
                  <th>Audio</th>
                  <th>Credential</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedEvents.map((event) => {
                  const user = event.user;
                  const isUnverified = !user?.verified;
                  const hash = event.latestCredential?.hash;

                  return (
                    <tr key={event.id} className={isUnverified ? 'row-unverified' : ''}>
                      <td>
                        <div className="table-ts">
                          {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                          <span className="msg-type">{event.messageType}</span>
                        </div>
                      </td>
                      <td>
                        {user ? (
                          <div className="table-meta">
                            <strong>{user.name || 'Unknown'}</strong>
                            <span className="email">{user.email}</span>
                            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                              <span className={`tag ${user.verified ? 'success' : 'warning'}`}>
                                {user.verified ? 'verified' : 'unverified'}
                              </span>
                              {user.idDocumentUrls?.length ? (
                                <a className="link" href={user.idDocumentUrls[0]} target="_blank" rel="noreferrer">view ID</a>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <span className="muted">no data</span>
                        )}
                      </td>
                      <td>
                        <div className="table-message">
                          <p>{event.messageText || '-'}</p>
                        </div>
                      </td>
                      <td>
                        {event.audioUrl ? <audio controls src={event.audioUrl} preload="none" /> : <span className="muted">none</span>}
                      </td>
                      <td>
                        {event.latestCredential ? (
                          <div className="table-meta">
                            <div className="hash-display">
                              <strong>hash</strong> {event.latestCredential.hash?.slice(0, 16)}...
                            </div>
                            {event.latestCredential.transactionHash ? (
                              <div className="hash-display">
                                <strong>tx</strong> {event.latestCredential.transactionHash.slice(0, 16)}...
                              </div>
                            ) : null}
                            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                              {renderHashStatus(hash)}
                              <button type="button" className="text-button" onClick={() => toggleExpanded(event.id)}>
                                {expandedRows.has(event.id) ? 'hide JSON' : 'view VC'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="muted">not issued</span>
                        )}
                        {expandedRows.has(event.id) && event.latestCredential?.verifiableCredential && (
                          <pre className="vc-preview">
                            {JSON.stringify(event.latestCredential.verifiableCredential, null, 2)}
                          </pre>
                        )}
                      </td>
                      <td>
                        <div className="action-group">
                          <button
                            type="button"
                            disabled={!user?.id || actionState.verify === user.id || user?.verified}
                            onClick={() => markVerified(user.id)}
                          >
                            {actionState.verify === user?.id ? '...' : 'verify'}
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            disabled={!user?.id || actionState.issue === user.id}
                            onClick={() => issueCredential(user.id)}
                          >
                            {actionState.issue === user?.id ? '...' : 'issue VC'}
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            disabled={!hash || actionState.check === (hash?.startsWith('0x') ? hash.slice(2) : hash)}
                            onClick={() => checkHash(hash)}
                          >
                            {actionState.check === (hash?.startsWith('0x') ? hash.slice(2) : hash)
                              ? '...'
                              : 'check hash'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card card--padded" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#e8edf4' }}>Police training module</h2>
          <button type="button" onClick={() => setTrainingOpen((v) => !v)} className={trainingOpen ? 'secondary' : ''}>
            {trainingOpen ? 'Close' : 'Launch'}
          </button>
        </div>
        {trainingOpen && (
          <div style={{ marginTop: '0.8rem', width: '100%', height: '520px', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <iframe
              title="Police Training Module"
              src="/training-game/index.html"
              allow="autoplay; fullscreen"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default DashboardPage;
