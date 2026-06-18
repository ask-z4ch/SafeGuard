import { useCallback, useEffect, useMemo, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';

import client from '../api/client';
import AudioRecorder from '../components/AudioRecorder';
import DocumentCard from '../components/DocumentCard';
import { useAuth } from '../context/AuthContext';

const defaultMessages = [
  'Need medical help',
  'Lost and need assistance',
  'Robbery in progress',
  'Fire emergency'
];

const DashboardPage = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const [selectedMessage, setSelectedMessage] = useState(defaultMessages[0]);
  const [customMessage, setCustomMessage] = useState('');
  const [messageMode, setMessageMode] = useState('default');
  const [audioBlob, setAudioBlob] = useState(null);
  const [sendingSos, setSendingSos] = useState(false);
  const [sosFeedback, setSosFeedback] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await client.get('/api/user/profile');
        setProfile(response.data);
        if (response.data?.user) {
          updateUser(response.data.user);
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Unable to load profile information.';
        setProfileError(msg);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [updateUser]);

  const documents = useMemo(() => profile?.documents || [], [profile]);
  const credentials = useMemo(() => profile?.credentials || profile?.vcs || [], [profile]);

  const getCurrentLocation = useCallback(async () => {
    setLocationLoading(true);
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
  }, []);

  const handleSendSos = async () => {
    setSosFeedback(null);

    const messageText = messageMode === 'custom' ? customMessage : selectedMessage;
    if (!messageText || (messageMode === 'custom' && !customMessage.trim())) {
      setSosFeedback({ type: 'error', text: 'Please provide a message before sending an SOS.' });
      return;
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
      const response = await client.post('/api/sos', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSosFeedback({ type: 'success', text: response?.data?.message || 'SOS sent successfully.' });
      setAudioBlob(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send SOS. Please try again.';
      setSosFeedback({ type: 'error', text: msg });
    } finally {
      setSendingSos(false);
    }
  };

  return (
    <section className="dashboard two-col">
      <div className="card card--padded status-card">
        <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Digital ID</h2>
        {loadingProfile ? (
          <p className="muted" style={{ marginTop: '0.8rem' }}>Loading...</p>
        ) : profileError ? (
          <p className="error">{profileError}</p>
        ) : (
          <>
            <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`status ${profile?.user?.verified ? 'success' : 'pending'}`}>
                {profile?.user?.verified ? 'Verified' : 'Pending verification'}
              </span>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
                Documents
              </h3>
              <div className="grid">
                {documents.length ? (
                  documents.map((doc) => <DocumentCard key={doc.id || doc._id} document={doc} />)
                ) : (
                  <p className="muted" style={{ margin: '0.4rem 0 0' }}>No documents uploaded yet.</p>
                )}
              </div>
            </div>

            <div className="vc-list" style={{ marginTop: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
                Verifiable credentials
              </h3>
              {credentials.length ? (
                <ul>
                  {credentials.map((vc) => (
                    <li key={vc.id || vc._id}>
                      <span>Credential</span>
                      {vc.transactionHash ? (
                        <small style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          tx: {vc.transactionHash.slice(0, 14)}...
                        </small>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted" style={{ margin: '0.4rem 0 0' }}>No credentials issued yet.</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="card card--padded sos-card">
        <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Emergency SOS</h2>
        <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.75rem' }}>
          Choose a preset or write your own message. Voice notes and location are included automatically.
        </p>

        <div className="form-inline">
          <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 500 }}>
            Message type
            <select value={messageMode} onChange={(event) => setMessageMode(event.target.value)}>
              <option value="default">Preset message</option>
              <option value="custom">Custom message</option>
            </select>
          </label>
          {messageMode === 'default' ? (
            <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 500 }}>
              Preset
              <select value={selectedMessage} onChange={(event) => setSelectedMessage(event.target.value)}>
                {defaultMessages.map((message) => (
                  <option key={message} value={message}>{message}</option>
                ))}
              </select>
            </label>
          ) : (
            <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 500 }}>
              Your message
              <textarea value={customMessage} maxLength={240} onChange={(event) => setCustomMessage(event.target.value)} placeholder="Describe your situation (240 char max)" />
            </label>
          )}
        </div>

        <AudioRecorder onRecordingComplete={setAudioBlob} onClear={() => setAudioBlob(null)} />

        <div className="sos-meta">
          {locationLoading ? (
            <small className="muted">Getting location...</small>
          ) : userLocation ? (
            <small style={{ color: 'var(--green)' }}>Location shared ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})</small>
          ) : (
            <small className="muted">Location will be sent with the alert</small>
          )}
        </div>

        <button type="button" disabled={sendingSos} onClick={handleSendSos} className="primary">
          {sendingSos ? 'Sending...' : 'Send SOS'}
        </button>
        {sosFeedback && <p className={sosFeedback.type === 'success' ? 'success' : 'error'}>{sosFeedback.text}</p>}
      </div>
    </section>
  );
};

export default DashboardPage;
