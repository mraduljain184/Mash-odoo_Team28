import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './WorkerDashboard.css';
import { useAuth } from '../auth/AuthContext';
import io from 'socket.io-client';

const API_BASE = process.env.REACT_APP_API_BASE || '';
const SOCKET_ENV = process.env.REACT_APP_SOCKET_URL || '';

export default function WorkerDashboard() {
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptedNotices, setAcceptedNotices] = useState([]);
  const navigate = useNavigate();
  const { setUser: setAuthUser } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    let done = false;
    async function run() {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/workshops/me/own`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.success) {
          if (!json.data) {
            navigate('/worker/workshop/new');
            return;
          }
          if (!done) setWorkshop(json.data);

          // After we know workerId, connect socket and join private room
          try {
            const candidates = [SOCKET_ENV, API_BASE, typeof window !== 'undefined' ? window.location.origin : '']
              .filter(Boolean)
              .map(u => u.replace(/^ws/, 'http'));
            const url = candidates[0];
            if (socketRef.current) { try { socketRef.current.disconnect(); } catch {} }
            const s = io(url, { transports: ['websocket', 'polling'], path: '/socket.io' });
            socketRef.current = s;
            s.on('connect', () => {
              try { s.emit('worker:join', { token, workerId: json.data.workerId || json.data.worker?._id || json.data.worker }); } catch {}
            });
            s.on('service:accepted', (payload) => {
              setAcceptedNotices(prev => {
                const id = String(payload.id);
                if (prev.some(x => String(x.id) === id)) return prev; // dedupe
                const item = { id, name: payload.name, user: payload.user, createdAt: payload.createdAt, imageUrl: payload.imageUrl, description: payload.description, lat: payload.lat, lng: payload.lng };
                return [item, ...prev].slice(0, 10);
              });
            });
          } catch {}
        }
      } catch {
        // ignore
      } finally { if (!done) setLoading(false); }
    }
    run();
    return () => { done = true; try { socketRef.current && socketRef.current.disconnect(); } catch {} };
  }, [navigate]);

  const logout = () => {
    try { localStorage.removeItem('token'); } catch {}
    try { localStorage.removeItem('user'); } catch {}
    try { setAuthUser && setAuthUser(null); } catch {}
    try { navigate('/login', { replace: true }); } catch {}
    try { window.location.replace('/login'); } catch {}
  };

  if (loading) return <div className="wdash-root"><div className="wdash-loading">Loading…</div></div>;
  if (!workshop) return null;

  return (
    <div className="wdash-root">
      <header className="wdash-header">
        <div className="wdash-brand">RoadGuard</div>
        <div className="wdash-title">My Workshop</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="wdash-edit" onClick={()=> navigate('/worker/workshop/new')}>Edit</button>
          <button className="wdash-edit" onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="wdash-main">
        <section className="wdash-card">
          <h2>{workshop.name}</h2>
          <div>Status: <strong>{workshop.status}</strong></div>
          <div>Address: {workshop.address || '—'}</div>
          <div>Rating: {Number(workshop.ratingAvg || 0).toFixed(1)} ({workshop.reviewsCount || 0})</div>
        </section>

        {acceptedNotices.length > 0 && (
          <section className="wdash-card">
            <h3>Recently Accepted Service Requests</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {acceptedNotices.map(n => (
                <li key={n.id} style={{ marginBottom: 8 }}>
                  <strong>{n.name}</strong> — {n.user?.name || n.user?.email || 'User'}
                  <div style={{ color: '#bbb', fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
