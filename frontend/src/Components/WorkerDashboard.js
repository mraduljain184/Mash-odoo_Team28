import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WorkerDashboard.css';
import { useAuth } from '../auth/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || '';

export default function WorkerDashboard() {
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setUser: setAuthUser } = useAuth();

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
        }
      } catch {
        // ignore
      } finally { if (!done) setLoading(false); }
    }
    run();
    return () => { done = true; };
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
      </main>
    </div>
  );
}
