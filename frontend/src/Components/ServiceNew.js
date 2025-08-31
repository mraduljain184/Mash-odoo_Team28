import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import './ServiceNew.css';

const API_BASE = process.env.REACT_APP_API_BASE || '';

export default function ServiceNew() {
  const { id: workshopId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', serviceType: 'instant', serviceTimeStart: '', serviceTimeEnd: '' });
  const [coords, setCoords] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: process.env.REACT_APP_MAP_API_KEY });

  useEffect(() => {
    console.log('[ServiceNew] API_BASE =', API_BASE);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, (err) => { console.warn('[ServiceNew] geolocation error', err); });
    }
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const fetchSignature = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/cloudinary/signature`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error('Failed to get upload signature');
    return json.data; // { timestamp, signature, cloudName, apiKey, folder }
  };

  const uploadToCloudinary = async (file) => {
    setUploadErr('');
    if (!file) return;
    try {
      setUploading(true);
      const cfg = await fetchSignature();
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', cfg.apiKey);
      fd.append('timestamp', cfg.timestamp);
      fd.append('signature', cfg.signature);
      fd.append('folder', cfg.folder);
      const url = `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`;
      const res = await fetch(url, { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok || json?.error) throw new Error(json?.error?.message || `status ${res.status}`);
      if (json.secure_url) setImageUrl(json.secure_url);
    } catch (err) {
      setUploadErr(String(err?.message || err));
      alert(`Cloudinary upload error: ${String(err?.message || err)}`);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const body = {
      name: form.name,
      description: form.description,
      serviceType: form.serviceType,
      serviceTimeStart: form.serviceType === 'prebook' ? form.serviceTimeStart : undefined,
      serviceTimeEnd: form.serviceType === 'prebook' ? form.serviceTimeEnd : undefined,
      lat: coords?.lat,
      lng: coords?.lng,
      workshopId,
      imageUrl,
    };
    console.log('[ServiceNew] submitting service payload', body);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      console.log('[ServiceNew] backend create response', res.status, json);
      if (json.success) {
        // Redirect to Track Service page
        const sid = json.data?._id || json.data?.id;
        if (sid) {
          navigate(`/services/${sid}/track`);
        } else {
          navigate(`/workshops/${workshopId}`);
        }
      }
    } catch (err) {
      console.error('[ServiceNew] submit exception', err);
      alert('Failed to create service');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="sn-root">
      <header className="sn-header">
        <div className="sn-title">New service</div>
      </header>

      <form className="sn-form" onSubmit={submit}>
        <div className="sn-left">
          <label className="sn-field">
            <span>Name:</span>
            <input name="name" value={form.name} onChange={onChange} required />
          </label>

          <label className="sn-field">
            <span>Description</span>
            <textarea name="description" value={form.description} onChange={onChange} rows={3} />
          </label>

          <label className="sn-field">
            <span>Service Type</span>
            <select name="serviceType" value={form.serviceType} onChange={onChange}>
              <option value="instant">Instant service</option>
              <option value="prebook">Pre-book slots</option>
            </select>
          </label>

          {form.serviceType === 'prebook' && (
            <div className="sn-time">
              <label className="sn-field">
                <span>Service time</span>
                <input type="datetime-local" name="serviceTimeStart" value={form.serviceTimeStart} onChange={onChange} />
              </label>
              <label className="sn-field">
                <span>to</span>
                <input type="datetime-local" name="serviceTimeEnd" value={form.serviceTimeEnd} onChange={onChange} />
              </label>
            </div>
          )}

          <div className="sn-divider" />

          <label className="sn-field">
            <span>Upload Image:</span>
            <input type="file" accept="image/*" onChange={(e)=> uploadToCloudinary(e.target.files?.[0])} disabled={uploading} />
            {uploading && <div className="sn-hint">Uploading…</div>}
            {uploadErr && <div className="sn-error">{uploadErr}</div>}
            {imageUrl && <div className="sn-hint">Image uploaded</div>}
          </label>

          <label className="sn-field">
            <span>Describe Issue:</span>
            <input name="issue" placeholder="" onChange={()=>{}} />
          </label>

          <div className="sn-actions">
            <button type="submit" className="sn-checkout" disabled={submitting || uploading}>{submitting ? 'Processing…' : 'Checkout'}</button>
          </div>
        </div>

        <aside className="sn-right">
          <div className="sn-maplabel">Location</div>
          {isLoaded && coords ? (
            <GoogleMap center={coords} zoom={14} mapContainerStyle={{ width: '100%', height: '180px', borderRadius: '12px' }}>
              <Marker position={coords} />
            </GoogleMap>
          ) : (
            <div className="sn-maploading">Loading map…</div>
          )}
        </aside>
      </form>
    </div>
  );
}