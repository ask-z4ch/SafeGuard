import { useEffect, useRef, useState } from 'react';
import { Camera } from '@capacitor/camera';

import client from '../api/client';

const idOptions = [
  { value: 'aadhar', label: 'Aadhar' },
  { value: 'passport', label: 'Passport' }
];

const dataUrlToBlob = (dataUrl) => {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bytes = atob(parts[1]);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  return new Blob([buf], { type: mime });
};

const UploadIdPage = () => {
  const [idType, setIdType] = useState('aadhar');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return undefined;
  }, [file]);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleCapture = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: 'dataUrl',
        saveToGallery: false,
      });
      if (photo.dataUrl) {
        const blob = dataUrlToBlob(photo.dataUrl);
        const capturedFile = new File([blob], `captured-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFile(capturedFile);
      }
    } catch (err) {
      if (err.message !== 'User cancelled photos app') {
        setError('Camera capture failed. Please use file upload instead.');
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please select an ID document to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('idType', idType);
    formData.append('document', file);

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await client.post('/api/user/upload-id', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(response?.data?.message || 'Document uploaded successfully');
      setFile(null);
      setPreviewUrl(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please retry.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card card--padded">
      <h2>Upload your government ID</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          ID Type
          <select value={idType} onChange={(event) => setIdType(event.target.value)}>
            {idOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="file-picker">
          Upload document
          <input type="file" accept="image/*,.pdf" onChange={handleFileChange} ref={fileInputRef} />
        </label>
        <button type="button" className="secondary" onClick={handleCapture} style={{ marginTop: '0.5rem' }}>
          Capture with camera
        </button>
        {previewUrl && (
          <div className="preview">
            <p>Preview</p>
            <img src={previewUrl} alt="ID preview" />
          </div>
        )}
        {file && !previewUrl && <p className="muted">Selected file: {file.name}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Uploading�' : 'Upload'}
        </button>
      </form>
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
    </section>
  );
};

export default UploadIdPage;
