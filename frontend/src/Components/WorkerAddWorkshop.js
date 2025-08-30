import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import './WorkerAddWorkshop.css';

const API_BASE = process.env.REACT_APP_API_BASE || '';

export default function WorkerAddWorkshop() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', status: 'open', address: '', servicesInput: '' });
  const [coords, setCoords] = useState(null);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: process.env.REACT_APP_MAP_API_KEY });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const services = form.servicesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const body = {
        name: form.name,
        status: form.status,
        address: form.address,
        lat: coords?.lat,
        lng: coords?.lng,
        images,
        services,
        ratingAvg: 0,
        reviewsCount: 0,
      };
      const res = await fetch(`${API_BASE}/api/workshops/me`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to create workshop');
      navigate('/worker/dashboard');
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ws-root">
      <header className="ws-header">
        <div className="ws-brand">RoadGuard</div>
        <div className="ws-title">Add Workshop</div>
      </header>
      <form className="ws-form" onSubmit={onSubmit}>
        <div className="ws-left">
          <label className="ws-field">
            <span>Name</span>
            <input name="name" value={form.name} onChange={onChange} required />
          </label>
          <label className="ws-field">
            <span>Status</span>
            <select name="status" value={form.status} onChange={onChange}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label className="ws-field">
            <span>Address</span>
            <input name="address" value={form.address} onChange={onChange} />
          </label>
          <label className="ws-field">
            <span>Services (comma separated)</span>
            <input name="servicesInput" value={form.servicesInput} onChange={onChange} placeholder="Oil change, Tyre, Battery" />
          </label>
          <div className="ws-actions">
            <button className="ws-btn" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save Workshop'}</button>
          </div>
          {error && <div className="ws-error">{error}</div>}
        </div>
        <aside className="ws-right">
          <div className="ws-maplabel">Location</div>
          {isLoaded && coords ? (
            <GoogleMap center={coords} zoom={14} mapContainerStyle={{ width: '100%', height: '200px', borderRadius: '12px' }}>
              <Marker position={coords} draggable onDragEnd={(e)=> setCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() })} />
            </GoogleMap>
          ) : (
            <div className="ws-maploading">Loading map…</div>
          )}
          <div className="ws-hint">Drag the marker to adjust exact location.</div>
        </aside>
      </form>
    </div>
  );
}
