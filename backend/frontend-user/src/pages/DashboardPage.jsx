import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

import client from '../api/client';
import AudioRecorder from '../components/AudioRecorder';
import DocumentCard from '../components/DocumentCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useNetworkStatus from '../hooks/useNetworkStatus';
import useRefreshOnFocus from '../hooks/useRefreshOnFocus';
import { cacheGet, cacheSet, isOnline, processSosQueue, queueSos } from '../utils/offline';

const defaultMessages = [
  'Need medical help',
  'Lost and need assistance',
  'Robbery in progress',
  'Fire emergency'
];

const DashboardPage = () => {
  const { updateUser } = useAuth();
  const { addToast } = useToast();
  const online = useNetworkStatus();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedMessage, setSelectedMessage] = useState(defaultMessages[0]);
  const [customMessage, setCustomMessage] = useState('');
  const [messageMode, setMessageMode] = useState('default');
  const [audioBlob, setAudioBlob] = useState(null);
  const [sendingSos, setSendingSos] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [viewingVc, setViewingVc] = useState(null);
  const [sosKey, setSosKey] = useState(0);

  const touchStartY = useRef(0);
  const audioRecorderRef = useRef(null);

  const fetchProfile = useCallback(async (silent) => {
    if (!online) {
      const cached = cacheGet('profile');
      if (cached) {
        setProfile(cached);
        setLoadingProfile(false);
      }
      return;
    }
    try {
      if (!silent) setLoadingProfile(true);
      else setRefreshing(true);
      const response = await client.get('/api/user/profile');
      setProfile(response.data);
      cacheSet('profile', response.data);
      setLastUpdated(Date.now());
      if (response.data?.user) {
        updateUser(response.data.user);
      }
    } catch (err) {
      const cached = cacheGet('profile');
      if (cached) {
        setProfile(cached);
        setProfileError(null);
      } else {
        setProfileError(err.response?.data?.message || 'Unable to load profile information.');
      }
    } finally {
      setLoadingProfile(false);
      setRefreshing(false);
    }
  }, [online, updateUser]);

  const requestPermissions = useCallback(async () => {
    if (Capacitor.getPlatform() !== 'android') return;
    try {
      const locResult = await Geolocation.requestPermissions();
      if (locResult.location !== 'granted') {
        addToast('Location permission is needed to share your position during SOS alerts.', 'warning');
      }
    } catch {
      // user denied or system prevented the prompt
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
    }
  }, [addToast]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (online) processSosQueue(client);
  }, [online]);

  useEffect(() => { requestPermissions(); }, [requestPermissions]);
  useRefreshOnFocus(() => fetchProfile(true), online);

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy > 100 && !loadingProfile && !refreshing) fetchProfile(true);
  };

  const messageTextValid = useMemo(() => {
    if (messageMode === 'custom') return customMessage.trim().length > 0;
    return selectedMessage.length > 0;
  }, [messageMode, customMessage, selectedMessage]);

  const documents = useMemo(() => profile?.documents || [], [profile]);
  const credentials = useMemo(() => profile?.credentials || profile?.vcs || [], [profile]);

  const getCurrentLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      if (Capacitor.getPlatform() === 'android') {
        const status = await Geolocation.checkPermissions();
        if (status.location !== 'granted' && status.coarseLocation !== 'granted') {
          try {
            const result = await Geolocation.requestPermissions();
            if (result.location !== 'granted') {
              addToast('Location permission needed to share position during SOS.', 'warning');
              setUserLocation(null);
              return null;
            }
          } catch {
            addToast('Unable to request location permission.', 'warning');
            setUserLocation(null);
            return null;
          }
        }
      }
    } catch {
    }
    try {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(coords);
      return coords;
    } catch {
      if (navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setUserLocation(coords);
              resolve(coords);
            },
            () => { setUserLocation(null); resolve(null); },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      }
      setUserLocation(null);
      return null;
    } finally {
      setLocationLoading(false);
    }
  }, [addToast]);

  const handleSendSos = async () => {
    const messageText = messageMode === 'custom' ? customMessage : selectedMessage;
    if (!messageText || (messageMode === 'custom' && !customMessage.trim())) {
      addToast('Please provide a message before sending an SOS.', 'error');
      return;
    }

    if (audioRecorderRef.current) {
      await audioRecorderRef.current.flushRecording();
    }

    const location = await getCurrentLocation();

    const payload = new FormData();
    payload.append('messageType', messageMode === 'custom' ? 'custom' : 'default');
    payload.append('messageText', messageText.trim());
    if (location) {
      payload.append('lat', String(location.lat));
      payload.append('lng', String(location.lng));
    }
    if (audioBlob) {
      payload.append('audioFile', audioBlob, 'sos-message.webm');
    }

    setSendingSos(true);
    try {
      if (!isOnline()) {
        await queueSos({
          messageType: messageMode === 'custom' ? 'custom' : 'default',
          messageText: messageText.trim(),
          lat: location ? String(location.lat) : null,
          lng: location ? String(location.lng) : null,
          audioBlob,
        });
        addToast('SOS queued — will send when connection is restored.', 'success');
        setAudioBlob(null);
        setSosKey((k) => k + 1);
        return;
      }
      const response = await client.post('/api/sos', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      addToast(response?.data?.message || 'SOS sent successfully.', 'success');
      setAudioBlob(null);
      setSelectedMessage(defaultMessages[0]);
      setCustomMessage('');
      setMessageMode('default');
      setSosKey((k) => k + 1);
    } catch (err) {
      if (!isOnline()) {
        await queueSos({
          messageType: messageMode === 'custom' ? 'custom' : 'default',
          messageText: messageText.trim(),
          lat: location ? String(location.lat) : null,
          lng: location ? String(location.lng) : null,
          audioBlob,
        });
        addToast('SOS queued — will send when connection is restored.', 'success');
        setAudioBlob(null);
        setSosKey((k) => k + 1);
      } else {
        addToast(err.response?.data?.message || 'Failed to send SOS.', 'error');
      }
    } finally {
      setSendingSos(false);
    }
  };

  return (
    <section className="dashboard two-col" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="card card--padded status-card">
        <div className="card-header-row">
          <h2 className="card-title">Digital ID</h2>
          {refreshing && <span className="loading-spinner" />}
        </div>
        {loadingProfile ? (
          <SkeletonLoader count={4} height="1.2rem" />
        ) : profileError ? (
          <div className="error">{profileError}</div>
        ) : (
          <>
            <div className="status-row">
              <span className={`status ${profile?.user?.verified ? 'success' : 'pending'}`}>
                {profile?.user?.verified ? 'Verified' : 'Pending verification'}
              </span>
              {lastUpdated && (
                <span className="last-updated">updated {Math.floor((Date.now() - lastUpdated) / 1000)}s ago</span>
              )}
            </div>

            <div className="section">
              <h3 className="section-title">Documents</h3>
              <div className="grid">
                {documents.length ? (
                  documents.map((doc) => <DocumentCard key={doc.id || doc._id} document={doc} />)
                ) : (
                  <p className="muted">No documents uploaded yet.</p>
                )}
              </div>
            </div>

            <div className="vc-list section">
              <h3 className="section-title">Verifiable credentials</h3>
              {credentials.length ? (
                <ul>
                  {credentials.map((vc) => (
                    <li key={vc.id || vc._id}>
                      <div>
                        <span>Credential</span>
                        {vc.transactionHash ? (
                          <><br /><small className="tx-hash">tx: {vc.transactionHash.slice(0, 14)}...</small></>
                        ) : null}
                      </div>
                      <button
                        type="button" className="secondary btn-xs"
                        onClick={() => setViewingVc(vc)}
                      >view</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No credentials issued yet.</p>
              )}
              {viewingVc && (
                <div className="vc-viewer">
                  <div className="vc-viewer-header">
                    <span className="muted">VC — {viewingVc.hash?.slice(0, 16)}...</span>
                    <div className="vc-viewer-actions">
                      <button
                        type="button" className="secondary btn-xs"
                        onClick={async () => {
                          const content = JSON.stringify(viewingVc.verifiableCredential, null, 2);
                          try {
                            await navigator.clipboard.writeText(content);
                            addToast('VC JSON copied to clipboard', 'success');
                          } catch {
                            addToast('Could not copy to clipboard', 'error');
                          }
                        }}
                      >copy JSON</button>
                      <button type="button" className="btn-xs" onClick={() => setViewingVc(null)}>close</button>
                    </div>
                  </div>
                  <pre className="vc-preview">{JSON.stringify(viewingVc.verifiableCredential, null, 2)}</pre>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="card card--padded sos-card">
        <h2 className="card-title">Emergency SOS</h2>
        <p className="muted" style={{ fontSize: '0.75rem' }}>
          Choose a preset or write your own message. Voice notes and location are included automatically.
          {!online && <span className="offline-notice">SOS will be queued and sent when connectivity is restored.</span>}
        </p>

        <div className="form-inline">
          <label className="field-label">
            Message type
            <select value={messageMode} onChange={(event) => setMessageMode(event.target.value)}>
              <option value="default">Preset message</option>
              <option value="custom">Custom message</option>
            </select>
          </label>
          {messageMode === 'default' ? (
            <label className="field-label">
              Preset
              <select value={selectedMessage} onChange={(event) => setSelectedMessage(event.target.value)}>
                {defaultMessages.map((message) => (
                  <option key={message} value={message}>{message}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="field-label">
              Your message
              <textarea value={customMessage} maxLength={240} onChange={(event) => setCustomMessage(event.target.value)} placeholder="Describe your situation (240 char max)" />
            </label>
          )}
        </div>

        <AudioRecorder ref={audioRecorderRef} key={sosKey} onRecordingComplete={setAudioBlob} onClear={() => setAudioBlob(null)} />

        <div className="sos-meta">
          {locationLoading ? (
            <small className="muted"><span className="loading-spinner" />Getting location...</small>
          ) : userLocation ? (
            <small className="location-ok">Location shared ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})</small>
          ) : (
            <small className="muted">Location will be sent with the alert</small>
          )}
        </div>

        <button type="button" disabled={sendingSos || !messageTextValid} onClick={handleSendSos} className={`primary ${sendingSos ? 'btn-loading' : ''}`}>
          {sendingSos ? 'Sending SOS' : 'Send SOS'}
        </button>
      </div>
    </section>
  );
};

export default DashboardPage;
