import { useEffect, useMemo, useState } from 'react';
import './HomePage.css';
import MapSection from './MapViewPage';

const API_BASE = process.env.REACT_APP_API_BASE || '';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [status, setStatus] = useState('all'); // all | open | closed
  const [distance, setDistance] = useState('all'); // all | lt2 | 5 | 10 | custom
  const [customRadius, setCustomRadius] = useState('');
  const [sortBy, setSortBy] = useState('nearby'); // nearby | rated
  const [view, setView] = useState('list'); // list | card | map
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [userLocation, setUserLocation] = useState(null);

  const radiusValue = useMemo(() => {
    if (distance === 'lt2') return 2;
    if (distance === '5') return 5;
    if (distance === '10') return 10;
    if (distance === 'custom' && Number(customRadius) > 0) return Number(customRadius);
    return null;
  }, [distance, customRadius]);

  // Fetch from backend
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        let lat, lng;
        // Attempt geolocation to enable nearby sorting on server
        if (navigator.geolocation) {
          try {
            const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 }));
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
            if (!cancelled && (!userLocation || Math.abs(userLocation.lat - lat) > 0.0001 || Math.abs(userLocation.lng - lng) > 0.0001)) {
              setUserLocation({ lat, lng });
            }
          } catch {}
        }
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (status !== 'all') params.set('status', status);
        params.set('sort', sortBy);
        if (lat && lng) {
          params.set('lat', String(lat));
          params.set('lng', String(lng));
          if (radiusValue != null) params.set('radiusKm', String(radiusValue));
        }
        const res = await fetch(`${API_BASE}/api/workshops?${params.toString()}`);
        const data = await res.json();
        if (!cancelled && data.success) {
          setItems(Array.isArray(data.data) ? data.data : []);
        }
      } catch (e) {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [query, status, sortBy, radiusValue]);

  // If permission already granted, capture location on mount
  useEffect(() => {
    let unmounted = false;
    if (navigator?.permissions && navigator?.geolocation) {
      navigator.permissions.query({ name: 'geolocation' }).then(status => {
        if (status.state === 'granted') {
          navigator.geolocation.getCurrentPosition(
            (pos) => { if (!unmounted) setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
            () => {},
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }
      }).catch(() => {});
    }
    return () => { unmounted = true; };
  }, []);

  // Trigger geolocation on user action when switching to Map view
  const handleViewChange = (mode) => {
    setView(mode);
    if (mode === 'map' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  };

  // Derived lists and pagination (restored)
  const filtered = useMemo(() => {
    let list = Array.isArray(items) ? [...items] : [];
    if (showOpenOnly) list = list.filter(w => w.status === 'open');
    return list;
  }, [items, showOpenOnly]);

  const pageSize = view === 'list' ? 7 : 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const pages = useMemo(() => {
    const maxButtons = 7;
    const arr = [];
    if (pageCount <= maxButtons) {
      for (let i = 1; i <= pageCount; i++) arr.push(i);
    } else {
      const s = Math.max(1, currentPage - 2);
      const e = Math.min(pageCount, s + maxButtons - 1);
      for (let i = s; i <= e; i++) arr.push(i);
      if (arr[0] !== 1) arr.unshift(1);
      if (arr[arr.length - 1] !== pageCount) arr.push(pageCount);
    }
    return arr;
  }, [currentPage, pageCount]);

  return (
    <div className="hg-root">
      {/* Header / Navbar */}
      <header className="hg-header">
        <div className="hg-brand">RoadGuard</div>
        <nav className="hg-nav">
          <a href="/" className="active">Home</a>
          <a href="/login">Login</a>
          <button className="icon-btn" title="Profile">⚪</button>
          <button className="icon-btn" title="Notifications">🔔</button>
        </nav>
      </header>

      {/* Center Search Capsule */}
      <div className="hg-search-wrap">
        <div className="hg-search-capsule">
          <input
            className="hg-search-input"
            placeholder="Search   Workshop"
            value={query}
            onChange={e=>setQuery(e.target.value)}
          />
          <button className="hg-search-btn">🔍</button>
        </div>
        <div className="hg-view-toggle">
          <button className={`hg-toggle-btn ${view==='list'?'active':''}`} onClick={()=>handleViewChange('list')} title="List view">☰</button>
          <button className={`hg-toggle-btn ${view==='card'?'active':''}`} onClick={()=>handleViewChange('card')} title="Card view">▦</button>
          <button className={`hg-toggle-btn ${view==='map'?'active':''}`} onClick={()=>handleViewChange('map')} title="Map view">🗺️</button>
        </div>
      </div>

      {/* Toolbar filters */}
      <div className="hg-toolbar">
        <label className="hg-check">
          <input type="checkbox" checked={showOpenOnly} onChange={e=>setShowOpenOnly(e.target.checked)} />
          <span>Show Open Only</span>
        </label>
        <div className="hg-pills">
          <div className="hg-pill">
            <label>Status</label>
            <select value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="hg-pill">
            <label>Distance</label>
            <select value={distance} onChange={e=>setDistance(e.target.value)}>
              <option value="all">All</option>
              <option value="lt2">≤ 2 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="custom">Custom</option>
            </select>
            {distance === 'custom' && (
              <input type="number" min="1" placeholder="km" value={customRadius} onChange={e=>setCustomRadius(e.target.value)} className="hg-radius" />
            )}
          </div>
          <div className="hg-pill">
            <label>Sort By</label>
            <div className="hg-sort">
              <button className={sortBy==='nearby'?'active':''} onClick={()=>setSortBy('nearby')}>Nearby</button>
              <button className={sortBy==='rated'?'active':''} onClick={()=>setSortBy('rated')}>Most Rated</button>
            </div>
          </div>
        </div>
      </div>

      {/* Results list */}
      <main className="hg-main">
        {loading ? (
          <div className="hg-loading">Loading workshops…</div>
        ) : (
          view === 'map' ? (
            <MapSection workshops={filtered} userLocation={userLocation} />
          ) : view === 'list' ? (
            pageItems.map(w => {
              // Removed premium badge logic; show actual rating instead
              const rating = Number(w.ratingAvg || 0);
              const reviews = Number(w.reviewsCount || 0);
              const fullStars = Math.round(rating);
              const stars = '★'.repeat(Math.max(0, Math.min(5, fullStars))) + '☆'.repeat(Math.max(0, 5 - fullStars));
              return (
                <section key={w._id} className="hg-card">
                  <div className="hg-avatar">
                    <img alt="preview" src={(w.images && w.images[0]) || 'https://via.placeholder.com/120'} />
                  </div>
                  <div className="hg-info">
                    <div className="hg-title-row">
                      <h3>{(w.name || '').toUpperCase()}</h3>
                      <div className={`hg-status ${w.status==='open'?'open':'closed'}`}>
                        <span className="icon">🕒</span>
                        <span className="text">{w.status === 'open' ? 'OPEN' : 'CLOSED'}</span>
                      </div>
                    </div>
                    <div className="hg-ratings">
                      <span className="label">Ratings:</span>
                      {rating > 0 ? (
                        <span className="hg-stars" title={`${rating.toFixed(1)} / 5`}>
                          {stars} <span className="hg-score">{rating.toFixed(1)}</span>
                          {reviews > 0 && <span className="hg-reviews">({reviews})</span>}
                        </span>
                      ) : (
                        <span className="hg-unrated">Not rated yet</span>
                      )}
                    </div>
                    <div className="hg-address">{w.address}</div>
                  </div>
                  <div className="hg-right">
                    {w.distanceKm != null && <div className="hg-distance">{Math.round(w.distanceKm)} km Away</div>}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="workshops card">
              {pageItems.map(w => {
                const rating = Number(w.ratingAvg || 0);
                const reviews = Number(w.reviewsCount || 0);
                const fullStars = Math.round(rating);
                const stars = '★'.repeat(Math.max(0, Math.min(5, fullStars))) + '☆'.repeat(Math.max(0, 5 - fullStars));
                return (
                  <div key={w._id} className="card-item">
                    <img alt="preview" src={(w.images && w.images[0]) || 'https://via.placeholder.com/320x180'} />
                    <div className="meta">
                      <div className="title-row">
                        <h3>{w.name}</h3>
                        <span className={`status ${w.status}`}>{w.status === 'open' ? 'Open' : 'Closed'}</span>
                      </div>
                      <div className="rating">{stars} <span className="reviews">{rating > 0 ? rating.toFixed(1) : '—'}{reviews>0 && ` (${reviews})`}</span></div>
                      <div className="sub">{w.address}</div>
                      {w.distanceKm != null && <div className="distance">{Math.round(w.distanceKm)} km away</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>

      {/* Pagination - hide on map view */}
      {view !== 'map' && (
        <div className="hg-pagination">
          <button disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>{'<'}</button>
          {pages.map(n => (
            <button key={n} className={n===currentPage? 'active' : ''} onClick={()=>setPage(n)}>{n}</button>
          ))}
          <button disabled={currentPage===pageCount} onClick={()=>setPage(p=>Math.min(pageCount,p+1))}>{'>'}</button>
        </div>
      )}
    </div>
  );
}
