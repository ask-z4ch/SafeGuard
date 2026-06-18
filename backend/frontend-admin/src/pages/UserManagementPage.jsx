import { useEffect, useState } from 'react';

import client from '../api/client';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const limit = 20;

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (search.trim()) params.search = search.trim();
      const res = await client.get('/api/admin/users', { params });
      setUsers(res.data.items);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  return (
    <section className="card card--padded" style={{ width: 'min(1280px, 100%)' }}>
      <header className="dashboard-header">
        <h2>User management</h2>
        <span className="sos-count">{total} users</span>
      </header>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          style={{
            flex: 1, padding: '0.45rem 0.7rem', borderRadius: '4px', border: '1px solid var(--border)',
            background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.8rem', fontFamily: 'inherit',
          }}
        />
        <button type="submit">Search</button>
      </form>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <p className="muted" style={{ marginTop: '1rem' }}>Loading...</p>
      ) : users.length === 0 ? (
        <p className="muted" style={{ marginTop: '1rem' }}>No users found.</p>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="sos-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Docs</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={!u.verified ? 'row-unverified' : ''}>
                    <td><div className="table-meta"><strong>{u.name}</strong></div></td>
                    <td><span className="email" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{u.email}</span></td>
                    <td>
                      <span className={`tag ${u.verified ? 'success' : 'warning'}`}>
                        {u.verified ? 'verified' : 'pending'}
                      </span>
                    </td>
                    <td><span className="tag info">{u.role}</span></td>
                    <td style={{ fontSize: '0.75rem' }}>{u.documentCount} / {u.vcCount} VCs</td>
                    <td><span className="table-ts">{new Date(u.createdAt).toLocaleDateString()}</span></td>
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

export default UserManagementPage;
