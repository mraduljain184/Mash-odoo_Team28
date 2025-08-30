import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import './WorkshopDetail.css';

const API_BASE = process.env.REACT_APP_API_BASE || '';

function WDMiniMap({ coordinates }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: process.env.REACT_APP_MAP_API_KEY });
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) return null;
  const center = { lat: coordinates[1], lng: coordinates[0] };
  return (
    <div className="wd-mini-map">
      {isLoaded ? (
        <GoogleMap center={center} zoom={14} mapContainerStyle={{ width: '100%', height: '160px', borderRadius: '12px' }}>
          <Marker position={center} />
        </GoogleMap>
      ) : (
        <div className="wd-map-loading">Loading map…</div>
      )}
    </div>
  );
}

export default function WorkshopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        let lat, lng;
        if (navigator.geolocation) {
          try {
            const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 }));
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          } catch {}
        }
        const params = new URLSearchParams();
        if (lat && lng) { params.set('lat', String(lat)); params.set('lng', String(lng)); }
        const res = await fetch(`${API_BASE}/api/workshops/${id}?${params.toString()}`);
        const json = await res.json();
        if (!cancelled && json.success) setData(json.data);
      } catch (e) {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="wd-root"><div className="wd-loading">Loading…</div></div>;
  if (!data) return <div className="wd-root"><div className="wd-loading">Not found</div></div>;

  const rating = Number(data.ratingAvg || 0);
  const reviews = Number(data.reviewsCount || 0);
  const fullStars = Math.round(rating);
  const stars = '★'.repeat(Math.max(0, Math.min(5, fullStars))) + '☆'.repeat(Math.max(0, 5 - fullStars));

  return (
    <div className="wd-root">
      <header className="wd-header">
        <div className="wd-brand">RoadGuard</div>
        <nav className="wd-nav">
          <a href="/" onClick={(e)=>{e.preventDefault(); navigate(-1);}}>Home</a>
          <button className="wd-icon" title="Profile">⚪</button>
          <button className="wd-icon" title="Notifications">🔔</button>
        </nav>
      </header>

      <main className="wd-main">
        <section className="wd-left">
          <h1 className="wd-title">{(data.name || '').toUpperCase()}</h1>
          <p className="wd-desc">{data.description || '—'}</p>

          <h3 className="wd-sub">Services We Provide:</h3>
          <div className="wd-services">
            {(data.services || []).map((s,i)=> (
              <div key={i} className="wd-service">
                <div className="wd-service-thumb" />
                <div className="wd-service-name">{s}</div>
              </div>
            ))}
          </div>

          <section className="wd-reviews">
            <h3>Customer Reviews</h3>
            <div className="wd-rating">{stars} <span>{rating>0? rating.toFixed(1):'—'}{reviews>0 && ` (${reviews})`}</span></div>
            <div className="wd-chat">
              <input placeholder="Write a message…" />
              <button>Send</button>
            </div>
          </section>
        </section>

        <aside className="wd-right">
          <button className="wd-book" onClick={() => navigate(`/workshops/${id}/service/new`)}>Book Service</button>
          <div className="wd-location">
            <h4>Location:</h4>
            <p>{data.address || '—'}</p>
            <WDMiniMap coordinates={data.location?.coordinates} />
          </div>
          <div className="wd-owner">
            {/* Worker details from worker.js schema (populated as `workerId`) */}
            <h4>Worker</h4>
            {(() => {
              const name = data.workerId?.name || '—';
              const phone = data.workerId?.phone || '—';
              const email = data.workerId?.email || '—';
              return (
                <div>
                  <div><strong>Name:</strong> {name}</div>
                  <div><strong>Phone:</strong> {phone !== '—' ? (<a href={`tel:${phone}`}>{phone}</a>) : '—'}</div>
                  <div><strong>Email:</strong> {email !== '—' ? (<a href={`mailto:${email}`}>{email}</a>) : '—'}</div>
                </div>
              );
            })()}
          </div>
          <div className="wd-share">
            <h4>Share</h4>
            <div className="wd-socials">
              {data.social?.website && <a href={data.social.website} target="_blank" rel="noreferrer">🌐</a>}
              {data.social?.facebook && <a href={data.social.facebook} target="_blank" rel="noreferrer">f</a>}
              {data.social?.instagram && <a href={data.social.instagram} target="_blank" rel="noreferrer">ig</a>}
              {data.social?.twitter && <a href={data.social.twitter} target="_blank" rel="noreferrer">x</a>}
              {data.social?.linkedin && <a href={data.social.linkedin} target="_blank" rel="noreferrer">in</a>}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
