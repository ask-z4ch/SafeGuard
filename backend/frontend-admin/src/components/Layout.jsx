import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Safeguard Admin</h1>
          <p className="subtitle">Live SOS command console</p>
        </div>
        <nav className="nav">
          {isAuthenticated ? (
            <>
              <span className="nav-user">{user?.email || 'Admin'}</span>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <button type="button" className="link-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">© {new Date().getFullYear()} Safeguard Prototype</footer>
    </div>
  );
};

export default Layout;
