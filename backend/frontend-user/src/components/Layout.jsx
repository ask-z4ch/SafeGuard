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
          <h1>Safeguard Companion</h1>
          {user ? <p className="subtitle">Welcome back, {user.name || user.email}</p> : <p className="subtitle">Travel safe with digital ID</p>}
        </div>
        <nav className="nav">
          <NavLink to="/register">Register</NavLink>
          <NavLink to="/verify">Verify</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/upload">Upload ID</NavLink>
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
