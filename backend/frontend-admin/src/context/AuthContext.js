import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext();

const loadInitialState = () => {
  try {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    return {
      token: token || null,
      user: user ? JSON.parse(user) : null
    };
  } catch {
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [{ token, user }, setState] = useState(loadInitialState);

  useEffect(() => {
    if (token) {
      localStorage.setItem('adminToken', token);
    } else {
      localStorage.removeItem('adminToken');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('adminUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('adminUser');
    }
  }, [user]);

  const login = (nextToken, nextUser) => {
    setState({ token: nextToken, user: nextUser || null });
  };

  const logout = () => setState({ token: null, user: null });

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout,
      isAuthenticated: Boolean(token)
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
