import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import './ServiceTrack.css';

const API_BASE = process.env.REACT_APP_API_BASE || '';

const STATUS_STEPS = [
  { key: 'pending', label: 'Pending for acceptance', color: '#a6b3cc' },
  { key: 'accepted', label: 'Accepted', color: '#60a5fa' },
  { key: 'inprogress', label: 'In progress', color: '#34d399' },
  { key: 'done', label: 'Done', color: '#a78bfa' },
];

export default function ServiceTrack() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: process.env.REACT_APP_MAP_API_KEY });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/services/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (!cancelled && json.success) setData(json.data);
      } catch {
        // ignore
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const stepIndex = useMemo(() => {
    if (!data) return 0;
    const map = { pending: 0, accepted: 1, inprogress: 2, done: 3 };
    return map[data.status] ?? 0;
  }, [data]);

  if (loading) return <div className="st-root"><div className="st-loading">Loading…</div></div>;
  if (!data) return <div className="st-root"><div className="st-loading">Not found</div></div>;

  const center = data.lat && data.lng ? { lat: data.lat, lng: data.lng } : null;
  const photos = (() => {
    const arr = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
    if (data.imageUrl) arr.unshift(data.imageUrl);
    return arr;
  })();

  return (
    <div className="st-root">
      <header className="st-header">
        <button className="st-back" onClick={()=> navigate(-1)}>←</button>
        <div className="st-title">Track Service</div>
      </header>

      <main className="st-main">
        <div className="st-top">
          <div className="st-status">
            <span className="st-dot" style={{ background: STATUS_STEPS[stepIndex].color }} />
            <span>{STATUS_STEPS[stepIndex].label}</span>
          </div>
          <div className="st-actions">
            <button className="st-pill st-ghost">Download report</button>
          </div>
        </div>

        <section className="st-body">
          <div className="st-left">
            <div className="st-field"><span>Name:</span><div>{data.name || '—'}</div></div>
            <div className="st-field"><span>Description:</span><div className="st-multi">{data.description || '—'}</div></div>
            {data.serviceType === 'prebook' && (
              <div className="st-field">
                <span>Service time</span>
                <div className="st-time">
                  <div>{data.serviceTimeStart ? new Date(data.serviceTimeStart).toLocaleString() : '—'}</div>
                  <div>{data.serviceTimeEnd ? new Date(data.serviceTimeEnd).toLocaleString() : '—'}</div>
                </div>
              </div>
            )}
          </div>

          <aside>
            <div className="st-label">Location</div>
            <div className="st-mapbox">
              {isLoaded && center ? (
                <GoogleMap center={center} zoom={14} options={{ disableDefaultUI: true, clickableIcons: false }} mapContainerStyle={{ width: '100%', height: '180px' }}>
                  <Marker position={center} />
                </GoogleMap>
              ) : (
                <div className="st-maploading">No location</div>
              )}
            </div>

            {photos.length > 0 && (
              <>
                <div className="st-label">Photos</div>
                <div className="st-photos">
                  {photos.slice(0,4).map((src, i) => (
                    <div className="st-photo" key={i}>
                      <img src={src} alt="service" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}