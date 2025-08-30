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
  const [file, setFile] = useState(null);
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: process.env.REACT_APP_MAP_API_KEY });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, () => {});
    }
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('serviceType', form.serviceType);
    if (form.serviceType === 'prebook') {
      if (form.serviceTimeStart) fd.append('serviceTimeStart', form.serviceTimeStart);
      if (form.serviceTimeEnd) fd.append('serviceTimeEnd', form.serviceTimeEnd);
    }
    if (coords) {
      fd.append('lat', String(coords.lat));
      fd.append('lng', String(coords.lng));
    }
    if (workshopId) fd.append('workshopId', workshopId);
    if (file) fd.append('image', file);

    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/api/services`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const json = await res.json();
    if (json.success) navigate(`/workshops/${workshopId}`);
  };

  return (
    <div className="sn-root">
      <header className="sn-header">
        <div className="sn-title">New service</div>
        <button className="sn-track" type="button">Track Service</button>
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
            <input type="file" accept="image/*" onChange={(e)=> setFile(e.target.files?.[0] || null)} />
          </label>

          <label className="sn-field">
            <span>Describe Issue:</span>
            <input name="issue" placeholder="" onChange={()=>{}} />
          </label>

          <button type="button" className="sn-chat">Chat with agent</button>
          <div className="sn-actions">
            <button type="submit" className="sn-checkout">Checkout</button>
          </div>
        </div>

        <aside className="sn-right">
          <div className="sn-mapwrap">
            <div className="sn-maplabel">Location</div>
            {isLoaded && coords ? (
              <GoogleMap center={coords} zoom={14} mapContainerStyle={{ width: '100%', height: '180px', borderRadius: '12px' }}>
                <Marker position={coords} />
              </GoogleMap>
            ) : (
              <div className="sn-maploading">Loading map…</div>
            )}
          </div>
        </aside>
      </form>
    </div>
  );
}
