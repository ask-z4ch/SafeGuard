import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { io } from 'socket.io-client';

import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import TrainingModule from '../components/TrainingModule';

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
    socket.on('connect_error', (err) => {
      console.error('Socket connection error', err);
      setSocketStatus('error');
    });

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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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
            ? {
                ...event,
                user: {
                  ...event.user,
                  verified: true
                }
              }
            : event
        )
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to verify user.';
      setError(msg);
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
                user: {
                  ...event.user,
                  verified: true
                }
              }
            : event
        )
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to issue credential.';
      setError(msg);
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

    if (!status) {
      return null;
    }

    if (status.status === 'loading') {
      return <span className="tag info">Checking...</span>;
    }

    if (status.status === 'error') {
      return <span className="tag danger">{status.error}</span>;
    }

    if (status.data?.onChain?.exists) {
      return <span className="tag success">On chain</span>;
    }

    return <span className="tag warning">Not anchored</span>;
  };

  return (
    <section className="dashboard">
      <div className="card card--padded">
        <header className="dashboard-header">
          <div>
            <h2>SOS Feed</h2>
            <p className="muted">
              Live updates from the field. Socket status: <strong>{socketStatus}</strong>
            </p>
          </div>
        </header>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <p className="muted">Loading SOS events...</p>
        ) : sortedEvents.length === 0 ? (
          <p className="muted">No SOS alerts yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="sos-table">
              <thead>
                <tr>
                  <th>When</th>
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
                        <div className="table-meta">
                          <span>{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</span>
                          <small className="muted">{event.messageType}</small>
                        </div>
                      </td>
                      <td>
                        {user ? (
                          <div className="table-meta">
                            <strong>{user.name || 'Unknown'}</strong>
                            <small>{user.email}</small>
                            <span className={`tag ${user.verified ? 'success' : 'warning'}`}>
                              {user.verified ? 'Verified' : 'Unverified'}
                            </span>
                            {user.idDocumentUrls?.length ? (
                              <a className="link" href={user.idDocumentUrls[0]} target="_blank" rel="noreferrer">
                                View ID
                              </a>
                            ) : (
                              <small className="muted">No ID uploaded</small>
                            )}
                          </div>
                        ) : (
                          <span className="muted">(no user data)</span>
                        )}
                      </td>
                      <td>
                        <div className="table-message">
                          <p>{event.messageText}</p>
                        </div>
                      </td>
                      <td>
                        {event.audioUrl ? <audio controls src={event.audioUrl} /> : <span className="muted">No audio</span>}
                      </td>
                      <td>
                        {event.latestCredential ? (
                          <div className="table-meta">
                            <span>Hash: {event.latestCredential.hash?.slice(0, 12)}...</span>
                            {event.latestCredential.transactionHash && (
                              <small>Tx: {event.latestCredential.transactionHash.slice(0, 12)}...</small>
                            )}
                            <button type="button" className="text-button" onClick={() => toggleExpanded(event.id)}>
                              {expandedRows.has(event.id) ? 'Hide VC' : 'View VC JSON'}
                            </button>
                            {renderHashStatus(hash)}
                          </div>
                        ) : (
                          <span className="muted">None issued</span>
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
                            className="secondary"
                            disabled={!user?.id || actionState.verify === user.id || user?.verified}
                            onClick={() => markVerified(user.id)}
                          >
                            {actionState.verify === user?.id ? 'Marking...' : 'Mark verified'}
                          </button>
                          <button
                            type="button"
                            disabled={!user?.id || actionState.issue === user.id}
                            onClick={() => issueCredential(user.id)}
                          >
                            {actionState.issue === user?.id ? 'Issuing...' : 'Issue VC'}
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            disabled={!hash || actionState.check === (hash?.startsWith('0x') ? hash.slice(2) : hash)}
                            onClick={() => checkHash(hash)}
                          >
                            {actionState.check === (hash?.startsWith('0x') ? hash.slice(2) : hash)
                              ? 'Checking...'
                              : 'Check hash'}
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

      <div className="card card--padded">
        <TrainingModule />
      </div>
    </section>
  );
};

export default DashboardPage;

