import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext();

const loadInitialState = () => {
  try {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('authUser');
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

  const login = useCallback((nextToken, nextUser) => {
    setState({ token: nextToken, user: nextUser || null });
  }, []);

  const logout = useCallback(() => {
    setState({ token: null, user: null });
  }, []);

  const updateUser = useCallback((nextUser) => {
    setState((prev) => ({ ...prev, user: nextUser }));
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('authUser');
    }
  }, [user]);

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout,
      updateUser,
      isAuthenticated: Boolean(token)
    }),
    [token, user, login, logout, updateUser]
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
