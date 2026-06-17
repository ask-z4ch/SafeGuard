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
        console.error('Profile error', err);
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

  const statusText = profile?.user?.verified ? 'Verified' : 'Pending verification';

  return (
    <section className="dashboard">
      <div className="card card--padded status-card">
        <h2>Your Digital ID Status</h2>
        {loadingProfile ? (
          <p className="muted">Loading profile�</p>
        ) : profileError ? (
          <p className="error">{profileError}</p>
        ) : (
          <>
            <p className={`status ${profile?.user?.verified ? 'success' : 'pending'}`}>Status: {statusText}</p>
            <div className="grid">
              {documents.length ? (
                documents.map((doc) => <DocumentCard key={doc.id || doc._id} document={doc} />)
              ) : (
                <p className="muted">No documents uploaded yet.</p>)
              }
            </div>
            <div className="vc-list">
              <h3>Verifiable Credentials</h3>
              {credentials.length ? (
                <ul>
                  {credentials.map((vc) => (
                    <li key={vc.id || vc._id}>
                      <span>{vc.hash?.slice(0, 12) || vc.type || 'Credential'}�</span>
                      {vc.transactionHash && (
                        <small>Tx: {vc.transactionHash.slice(0, 12)}�</small>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No credentials issued yet.</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="card card--padded sos-card">
        <h2>Emergency SOS</h2>
        <p className="muted">Select a preset or craft your own message, attach voice notes, and dispatch instantly.</p>

        <div className="form-inline">
          <label>
            Message type
            <select value={messageMode} onChange={(event) => setMessageMode(event.target.value)}>
              <option value="default">Use preset message</option>
              <option value="custom">Write my own</option>
            </select>
          </label>
          {messageMode === 'default' ? (
            <label>
              Preset message
              <select value={selectedMessage} onChange={(event) => setSelectedMessage(event.target.value)}>
                {defaultMessages.map((message) => (
                  <option key={message} value={message}>
                    {message}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Custom message
              <textarea value={customMessage} maxLength={240} onChange={(event) => setCustomMessage(event.target.value)} placeholder="Describe your situation" />
            </label>
          )}
        </div>

        <AudioRecorder onRecordingComplete={setAudioBlob} onClear={() => setAudioBlob(null)} />

        <div className="sos-meta">
          {locationLoading ? (
            <small className="muted">Getting location...</small>
          ) : userLocation ? (
            <small className="success">Location shared ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})</small>
          ) : (
            <small className="muted">Location will be sent with SOS</small>
          )}
        </div>

        <button type="button" disabled={sendingSos} onClick={handleSendSos} className="primary">
          {sendingSos ? 'Sending SOS�' : 'Send SOS'}
        </button>
        {sosFeedback && <p className={sosFeedback.type === 'success' ? 'success' : 'error'}>{sosFeedback.text}</p>}
      </div>
    </section>
  );
};

export default DashboardPage;
