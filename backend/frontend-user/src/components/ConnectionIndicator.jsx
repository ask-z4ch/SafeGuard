import { useEffect, useRef, useState } from 'react';

import client from '../api/client';

const ConnectionIndicator = () => {
  const intervalRef = useRef();
  const [apiOk, setApiOk] = useState(true);

  useEffect(() => {
    const check = () => {
      client.get('/health', { timeout: 10000 })
        .then(() => setApiOk(true))
        .catch(() => setApiOk(false));
    };
    check();
    intervalRef.current = setInterval(check, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const ok = apiOk;

  return (
    <span className="connection-dot" title={ok ? 'Connected' : 'Disconnected'}>
      <span className={`dot ${ok ? 'dot--ok' : 'dot--err'}`} />
      <span className="dot-label">{ok ? 'live' : 'offline'}</span>
    </span>
  );
};

export default ConnectionIndicator;
