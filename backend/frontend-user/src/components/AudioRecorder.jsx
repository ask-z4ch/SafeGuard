import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

const AudioRecorder = forwardRef(({ onRecordingComplete, onClear }, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const flushResolveRef = useRef(null);

  useImperativeHandle(ref, () => ({
    flushRecording: () => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        return Promise.resolve(false);
      }
      return new Promise((resolve) => {
        flushResolveRef.current = resolve;
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      });
    }
  }));

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    stopStream();
  }, [audioUrl, stopStream]);

  const requestMicPermission = async () => {
    if (Capacitor.getPlatform() !== 'android') return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  };

  const startRecording = async () => {
    setError(null);
    const hasPerm = await requestMicPermission();
    if (!hasPerm) {
      setError('Microphone permission is required. Please grant it in Settings.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete?.(blob);
        stopStream();
        if (flushResolveRef.current) {
          flushResolveRef.current(true);
          flushResolveRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    onClear?.();
  };

  return (
    <div className="recorder">
      <div className="recorder-controls">
        <button type="button" onClick={isRecording ? stopRecording : startRecording} className={isRecording ? 'danger' : ''}>
          {isRecording ? 'Stop recording' : 'Record voice'}
        </button>
        {audioUrl && (
          <button type="button" onClick={clearRecording} className="secondary">
            Remove audio
          </button>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      {audioUrl && (
        <div className="recorder-preview">
          <audio controls src={audioUrl} />
        </div>
      )}
    </div>
  );
});

export default AudioRecorder;
