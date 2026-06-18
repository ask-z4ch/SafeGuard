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
      <div className="sys-bar">
        <span className="class-mark">Restricted &#8212; Authorized Personnel Only</span>
        <span><span className="dot green"></span>SYS ONLINE</span>
        <span><span className="dot amber"></span>MONITORING</span>
      </div>
      <header className="app-header">
        <div>
          <h1>safeguard <small>admin console</small></h1>
        </div>
        <nav className="nav">
          {isAuthenticated ? (
            <>
              <span className="nav-user">{user?.email}</span>
              <NavLink to="/dashboard">SOS</NavLink>
              <NavLink to="/users">Users</NavLink>
              <NavLink to="/verify">Verify</NavLink>
              <NavLink to="/audit">Audit</NavLink>
              <button type="button" className="link-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : null}
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
