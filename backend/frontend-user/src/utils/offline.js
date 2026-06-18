const CACHE_PREFIX = 'sg_';
const SOS_QUEUE_KEY = CACHE_PREFIX + 'sos_queue';
const CACHE_TTL = 1000 * 60 * 30;

export const isOnline = () => navigator.onLine;

export const onOnline = (fn) => {
  window.addEventListener('online', fn);
  return () => window.removeEventListener('online', fn);
};

export const onOffline = (fn) => {
  window.addEventListener('offline', fn);
  return () => window.removeEventListener('offline', fn);
};

export const cacheSet = (key, data, ttl = CACHE_TTL) => {
  try {
    const entry = { data, expires: Date.now() + ttl };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    localStorage.removeItem(CACHE_PREFIX + key);
  }
};

export const cacheGet = (key) => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() > entry.expires) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
};

export const cacheClear = (key) => {
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch {}
};

const blobToBase64 = (blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
};

const base64ToBlob = (base64, mimeType) => {
  const byteChars = atob(base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteChars.length; offset += 512) {
    const slice = byteChars.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: mimeType || 'audio/webm' });
};

export const queueSos = async ({ messageType, messageText, lat, lng, audioBlob }) => {
  try {
    let audioData = null;
    if (audioBlob) {
      audioData = {
        base64: await blobToBase64(audioBlob),
        mimeType: audioBlob.type,
        name: 'sos-message.webm',
      };
    }
    const entry = { messageType, messageText, lat, lng, audioData, queuedAt: Date.now() };
    const raw = localStorage.getItem(SOS_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push(entry);
    localStorage.setItem(SOS_QUEUE_KEY, JSON.stringify(queue));
  } catch {}
};

export const getQueuedSos = () => {
  try {
    const raw = localStorage.getItem(SOS_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const reconstructFormData = (item) => {
  const fd = new FormData();
  fd.append('messageType', item.messageType || 'default');
  fd.append('messageText', item.messageText || '');
  if (item.lat && item.lng) {
    fd.append('lat', String(item.lat));
    fd.append('lng', String(item.lng));
  }
  if (item.audioData) {
    const blob = base64ToBlob(item.audioData.base64, item.audioData.mimeType);
    fd.append('audioFile', blob, item.audioData.name || 'sos-message.webm');
  }
  return fd;
};

let processing = false;

export const processSosQueue = async (client) => {
  if (processing) return;
  processing = true;
  try {
    const queue = getQueuedSos();
    if (!queue.length) return;
    const remaining = [];
    for (const item of queue) {
      try {
        const formData = reconstructFormData(item);
        await client.post('/api/sos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } catch {
        remaining.push(item);
      }
    }
    localStorage.setItem(SOS_QUEUE_KEY, JSON.stringify(remaining));
    return remaining.length === 0;
  } finally {
    processing = false;
  }
};
