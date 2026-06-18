import { useEffect, useRef, useState } from 'react';
import client from '../api/client';

const SosAudioPlayer = ({ audioUrl }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    if (!audioUrl) return;
    let cancelled = false;
    client.get(audioUrl, { responseType: 'blob' }).then((res) => {
      if (cancelled) return;
      const url = URL.createObjectURL(res.data);
      objectUrlRef.current = url;
      setBlobUrl(url);
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [audioUrl]);

  if (!blobUrl) return <span className="muted">loading...</span>;
  return <audio controls src={blobUrl} preload="none" />;
};

export default SosAudioPlayer;
