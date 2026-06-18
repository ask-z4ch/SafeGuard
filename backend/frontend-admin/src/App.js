import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AuditLogPage from './pages/AuditLogPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import UserManagementPage from './pages/UserManagementPage';
import VcVerifierPage from './pages/VcVerifierPage';

import './App.css';

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
          <Route path="login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route
            path="dashboard"
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
          />
          <Route
            path="users"
            element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>}
          />
          <Route
            path="audit"
            element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>}
          />
          <Route
            path="verify"
            element={<ProtectedRoute><VcVerifierPage /></ProtectedRoute>}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
};

export default App;
