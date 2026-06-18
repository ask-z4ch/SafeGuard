import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import client from '../api/client';

const SosHistoryPage = () => {
  const [sosRecords, setSosRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    const fetchSos = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await client.get('/api/sos/history', { params: { page, limit } });
        setSosRecords(res.data?.items || []);
        setTotal(res.data?.total || 0);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load SOS history');
      } finally {
        setLoading(false);
      }
    };
    fetchSos();
  }, [page]);

  return (
    <section className="card card--padded" style={{ width: 'min(720px, 100%)' }}>
      <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>SOS history</h2>
      <p className="muted" style={{ margin: '0.2rem 0 0.8rem', fontSize: '0.75rem' }}>{total} total alerts</p>

      {error && <div className="error">{error}</div>}
      {loading ? (
        <p className="muted">Loading...</p>
      ) : sosRecords.length === 0 ? (
        <p className="muted">No SOS alerts sent yet.</p>
      ) : (
        <>
          <div className="vc-list">
            <ul>
              {sosRecords.map((record) => (
                <li key={record.id}>
                  <div>
                    <strong>{record.messageText || record.messageType}</strong>
                    {record.location && (
                      <small style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                        {record.location.lat.toFixed(4)}, {record.location.lng.toFixed(4)}
                      </small>
                    )}
                  </div>
                  <small style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {formatDistanceToNow(new Date(record.createdAt), { addSuffix: true })}
                  </small>
                </li>
              ))}
            </ul>
          </div>
          {total > limit && (
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginTop: '0.8rem' }}>
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="secondary">Prev</button>
              <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="secondary">Next</button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default SosHistoryPage;
