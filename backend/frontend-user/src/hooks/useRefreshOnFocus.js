import { useEffect, useRef } from 'react';

const useRefreshOnFocus = (callback, enabled = true) => {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const onFocus = () => cbRef.current();
    const onVisibility = () => { if (document.visibilityState === 'visible') cbRef.current(); };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    const interval = setInterval(() => cbRef.current(), 30000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, [enabled]);
};

export default useRefreshOnFocus;
