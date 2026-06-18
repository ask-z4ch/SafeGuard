import { useState, useMemo, useCallback } from 'react';

const TrainingModule = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const iframeSrc = useMemo(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://safeguard-c7n8.onrender.com';
    return `${apiUrl}/training-module/index.html`;
  }, []);

  const handleError = useCallback(() => setLoadFailed(true), []);

  return (
    <div>
      <button type="button" onClick={() => { setIsVisible((v) => !v); setLoadFailed(false); }}>
        {isVisible ? 'Close training module' : 'Launch training module'}
      </button>
      {isVisible && (
        <div style={{ marginTop: '0.5rem', width: '100%', height: '520px', border: '1px solid #ccc', overflow: 'hidden', position: 'relative' }}>
          {loadFailed ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              Training module not available in production. Set <code>TRAINING_MODULE_URL</code> on the API server, or run locally.
            </p>
          ) : (
            <iframe
              title="Police Training Module"
              src={iframeSrc}
              allow="autoplay; fullscreen"
              onError={handleError}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default TrainingModule;
