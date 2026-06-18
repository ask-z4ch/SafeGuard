import { useEffect, useState } from 'react';

import useNetworkStatus from '../hooks/useNetworkStatus';
import { getQueuedSos } from '../utils/offline';

const OfflineBanner = () => {
  const online = useNetworkStatus();
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    if (!online) {
      setQueuedCount(0);
      return;
    }
    const check = () => setQueuedCount(getQueuedSos().length);
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [online]);

  if (online && !queuedCount) return null;

  return (
    <div className={`offline-banner ${online ? 'syncing' : ''}`}>
      {online
        ? `${queuedCount} SOS message${queuedCount !== 1 ? 's' : ''} queued — will send when connection is stable`
        : 'You are offline. Some features may be limited.'}
    </div>
  );
};

export default OfflineBanner;
