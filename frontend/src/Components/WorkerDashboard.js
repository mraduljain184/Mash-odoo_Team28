import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WorkerDashboard.css';

const API_BASE = process.env.REACT_APP_API_BASE || '';

export default function WorkerDashboard() {
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  if (loading) return <div className="wdash-root"><div className="wdash-loading">Loading…</div></div>;
  if (!workshop) return null;

  return (
    <div className="wdash-root">
      <header className="wdash-header">
        <div className="wdash-brand">RoadGuard</div>
        <div className="wdash-title">My Workshop</div>
        <button className="wdash-edit" onClick={()=> navigate('/worker/workshop/new')}>Edit</button>
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
