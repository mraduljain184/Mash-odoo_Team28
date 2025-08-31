import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import './WorkerAddWorkshop.css';

const API_BASE = process.env.REACT_APP_API_BASE || '';

export default function WorkerAddWorkshop() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', status: 'open', address: '' });
  const [coords, setCoords] = useState(null);
  const [images, setImages] = useState([]); // workshop gallery URLs
  const [services, setServices] = useState([]); // [{name, imageUrl}]
  const [newService, setNewService] = useState({ name: '', imageUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: process.env.REACT_APP_MAP_API_KEY });

  // Load existing workshop (for edit) and initialize coords
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            if (!alive) return;
            setCoords((c) => c || { lat: pos.coords.latitude, lng: pos.coords.longitude });
          });
        }
      } catch {}
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/workshops/me/own`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (!alive) return;
        if (json?.success && json?.data) {
          const w = json.data;
          setIsEdit(true);
          setForm({ name: w.name || '', status: w.status || 'open', address: w.address || '' });
          if (Array.isArray(w.images)) setImages(w.images);
          if (Array.isArray(w.services)) {
            setServices(w.services.map(s => (typeof s === 'string' ? { name: s, imageUrl: '' } : { name: s.name || '', imageUrl: s.imageUrl || '' }))); }
          if (Array.isArray(w.location?.coordinates) && w.location.coordinates.length >= 2) {
            setCoords({ lat: w.location.coordinates[1], lng: w.location.coordinates[0] });
          }
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // Cloudinary helpers
  const fetchSignature = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/cloudinary/signature`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!json.success) throw new Error('Failed to get upload signature');
    return json.data; // { timestamp, signature, cloudName, apiKey, folder }
  };

  const uploadOne = async (file) => {
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
    return json.secure_url;
  };

  const onUploadWorkshopImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const f of files) {
        const u = await uploadOne(f);
        urls.push(u);
      }
      setImages(prev => [...prev, ...urls]);
    } catch (err) {
      alert(`Upload failed: ${String(err?.message || err)}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onUploadServiceImage = async (e, idx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadOne(file);
      setServices(prev => prev.map((s,i)=> i===idx ? { ...s, imageUrl: url } : s));
    } catch (err) {
      alert(`Upload failed: ${String(err?.message || err)}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const addService = () => {
    const nm = (newService.name || '').trim();
    if (!nm) return;
    setServices(prev => [...prev, { name: nm, imageUrl: newService.imageUrl || '' }]);
    setNewService({ name: '', imageUrl: '' });
  };

  const removeService = (idx) => setServices(prev => prev.filter((_, i) => i !== idx));
  const removeWorkshopImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const body = {
        name: form.name,
        status: form.status,
        address: form.address,
        lat: coords?.lat,
        lng: coords?.lng,
        images,
        services,
      };
      const url = `${API_BASE}/api/workshops/me`;
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to save workshop');
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
        <div className="ws-title">{isEdit ? 'Edit Workshop' : 'Add Workshop'}</div>
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

          <div className="ws-divider" />

          <div className="ws-field">
            <span>Workshop Images</span>
            <input type="file" accept="image/*" multiple onChange={onUploadWorkshopImages} disabled={uploading} />
            {uploading && <div className="ws-hint">Uploading…</div>}
            {images?.length > 0 && (
              <div className="ws-hint">{images.length} image(s) uploaded</div>
            )}
            {images?.length > 0 && (
              <button type="button" onClick={()=> setImages([])}>Clear images</button>
            )}
          </div>

          <div className="ws-divider" />

          <div className="ws-field">
            <span>Services</span>
            <div className="ws-service-add">
              <input placeholder="Service name" value={newService.name} onChange={(e)=> setNewService(s=>({ ...s, name: e.target.value }))} />
              <button type="button" onClick={addService}>Add</button>
            </div>
            <div className="ws-services-list">
              {services.map((s, idx) => (
                <div key={idx} className="ws-service-item">
                  <div className="ws-service-row">
                    <input value={s.name} onChange={(e)=> setServices(prev => prev.map((it,i)=> i===idx ? { ...it, name: e.target.value } : it))} />
                    <button type="button" onClick={()=> removeService(idx)}>Remove</button>
                  </div>
                  <div className="ws-service-upload">
                    <input type="file" accept="image/*" onChange={(e)=> onUploadServiceImage(e, idx)} disabled={uploading} />
                    {s.imageUrl ? (
                      <div className="ws-hint">Image uploaded</div>
                    ) : (
                      <div className="ws-hint">No image</div>
                    )}
                    {s.imageUrl && (
                      <button type="button" onClick={()=> setServices(prev => prev.map((it,i)=> i===idx ? { ...it, imageUrl: '' } : it))}>Remove image</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ws-actions">
            <button className="ws-btn" type="submit" disabled={submitting || uploading}>{submitting ? 'Saving…' : (isEdit ? 'Save Changes' : 'Save Workshop')}</button>
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
