import { useCallback, useEffect, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

import client from '../api/client';
import SkeletonLoader from '../components/SkeletonLoader';
import useRefreshOnFocus from '../hooks/useRefreshOnFocus';

const SosHistoryPage = () => {
  const [sosRecords, setSosRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const touchStartY = useRef(0);

  const fetchSos = useCallback(async (silent) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const res = await client.get('/api/sos/history', { params: { page, limit } });
      setSosRecords(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load SOS history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useEffect(() => { fetchSos(); }, [fetchSos]);
  useRefreshOnFocus(() => fetchSos(true));

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy > 100 && !loading && !refreshing) fetchSos(true);
  };

  return (
    <section className="card card--padded" style={{ width: 'min(720px, 100%)' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="card-header-row">
        <h2 className="card-title">SOS history</h2>
        {refreshing && <span className="loading-spinner" />}
      </div>
      <p className="muted" style={{ margin: '0.2rem 0 0.8rem', fontSize: '0.75rem' }}>{total} total alerts</p>

      {error && <div className="error">{error}</div>}
      {loading ? (
        <SkeletonLoader count={5} height="2.4rem" />
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
                      <small className="location-coords">
                        {record.location.lat.toFixed(4)}, {record.location.lng.toFixed(4)}
                      </small>
                    )}
                  </div>
                  <small className="timestamp-mono">
                    {formatDistanceToNow(new Date(record.createdAt), { addSuffix: true })}
                  </small>
                </li>
              ))}
            </ul>
          </div>
          {total > limit && (
            <div className="pagination-row">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="secondary">Prev</button>
              <span className="muted" style={{ fontSize: '0.75rem' }}>{page} / {Math.ceil(total / limit)}</span>
              <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="secondary">Next</button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default SosHistoryPage;
