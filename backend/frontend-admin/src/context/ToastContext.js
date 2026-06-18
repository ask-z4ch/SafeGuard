import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext();

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.4rem', maxWidth: '360px' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            style={{
              padding: '0.55rem 0.9rem',
              borderRadius: '4px',
              fontSize: '0.78rem',
              cursor: 'pointer',
              background: t.type === 'error' ? '#2a1215' : t.type === 'success' ? '#0f261a' : '#162033',
              border: `1px solid ${t.type === 'error' ? 'rgba(209,91,91,0.3)' : t.type === 'success' ? 'rgba(76,175,125,0.3)' : 'rgba(75,123,190,0.3)'}`,
              color: t.type === 'error' ? '#e89090' : t.type === 'success' ? '#7dcea0' : '#b0bed4',
              boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
