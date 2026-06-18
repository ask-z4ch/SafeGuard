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
          <h1>safeguard <small>companion</small></h1>
        </div>
        <nav className="nav">
          {isAuthenticated ? (
            <>
              <span className="nav-user">{user?.name || user?.email}</span>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/upload">Upload ID</NavLink>
              <button type="button" className="link-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">safeguard v1.0.0 &mdash; {new Date().getFullYear()}</footer>
    </div>
  );
};

export default Layout;
