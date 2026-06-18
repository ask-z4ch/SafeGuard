import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

import client from '../api/client';

const actionLabels = {
  issue_vc: 'Issued VC',
  verify_user: 'Verified user',
  delete_document: 'Deleted document',
};

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await client.get('/api/admin/audit-logs', { params: { page, limit: 20 } });
        setLogs(res.data.items);
        setTotal(res.data.total);
        setPages(res.data.pages);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page]);

  return (
    <section className="card card--padded" style={{ width: 'min(1280px, 100%)' }}>
      <header className="dashboard-header">
        <h2>Audit trail</h2>
        <span className="sos-count">{total} entries</span>
      </header>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <p className="muted" style={{ marginTop: '1rem' }}>Loading...</p>
      ) : logs.length === 0 ? (
        <p className="muted" style={{ marginTop: '1rem' }}>No audit logs yet.</p>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="sos-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td><span className="table-ts">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span></td>
                    <td><span className="email" style={{ fontSize: '0.7rem' }}>{log.admin?.email || 'unknown'}</span></td>
                    <td><span className="tag info">{actionLabels[log.action] || log.action}</span></td>
                    <td><span className="email" style={{ fontSize: '0.7rem' }}>{log.targetUser?.email || '-'}</span></td>
                    <td style={{ fontSize: '0.7rem', color: 'var(--text-dim)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details?.hash ? `${log.details.hash.slice(0, 16)}...` : log.details?.idType || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem', fontSize: '0.75rem' }}>
            <span className="muted">Page {page} of {pages}</span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="secondary">Prev</button>
              <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="secondary">Next</button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default AuditLogPage;
