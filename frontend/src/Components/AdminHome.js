import { useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';
import './AdminHome.css';

const API_BASE = process.env.REACT_APP_API_BASE || '';
const SOCKET_ENV = process.env.REACT_APP_SOCKET_URL || '';

export default function AdminHome(){
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState({ openForRequest: true });

  const refresh = async () => {
    const r1 = await fetch(`${API_BASE}/api/admin/service-requests`).then(r=>r.json());
    if (r1?.success) setItems(r1.data);
    const rs = await fetch(`${API_BASE}/api/admin/settings`).then(r=>r.json());
    if (rs?.success) setSettings(rs.data);
  };

  useEffect(() => {
    refresh();

    const candidates = [SOCKET_ENV, API_BASE, typeof window !== 'undefined' ? window.location.origin : '']
      .filter(Boolean)
      .map(u => u.replace(/^ws/, 'http'));

    let s; let idx = 0; let unmounted = false;
    const tryConnect = () => {
      if (idx >= candidates.length) return;
      const url = candidates[idx++];
      const sock = io(url, { transports: ['websocket', 'polling'], path: '/socket.io' });
      sock.on('connect', () => { if (!unmounted) s = sock; });
      sock.on('service:new', (payload) => {
        if (unmounted) return; setItems(prev => [{ _id: payload.id, name: payload.name, description: payload.description, imageUrl: payload.imageUrl, serviceType: payload.serviceType, user: payload.user, status: 'pending', createdAt: payload.createdAt }, ...prev]);
      });
      sock.on('connect_error', () => { sock.disconnect(); tryConnect(); });
    };
    tryConnect();

    return () => { unmounted = true; if (s) s.disconnect(); };
  }, []);

  const onAction = async (id, status) => {
    await fetch(`${API_BASE}/api/admin/service-requests/${id}/status`, { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ status }) });
    setItems(prev => prev.map(x => x._id === id ? { ...x, status } : x));
  };

  const toggleOpen = async () => {
    const next = !settings.openForRequest;
    const res = await fetch(`${API_BASE}/api/admin/settings`, { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ openForRequest: next })});
    const j = await res.json();
    if (j.success) setSettings(j.data);
  };

  return (
    <div className="ah-root">
      <header className="ah-topbar">
        <div className="ah-open" onClick={toggleOpen}>
          <span className={`ah-dot ${settings.openForRequest? 'ah-on':'ah-off'}`}></span>
          <span>Open For Request</span>
        </div>
        <div className="ah-right">
          <button className="ah-btn">Notification</button>
          <button className="ah-user">User</button>
        </div>
      </header>

      <section className="ah-livebanner">Live service requests will appear here instantly as users checkout.</section>

      <main className="ah-main">
        {items.map(item => (
          <div className="ah-card" key={item._id}>
            <div className="ah-row">
              <div>
                <div className="ah-title">{item.name}</div>
                {item.description && <div className="ah-desc">{item.description}</div>}
                <div className="ah-meta">Type: {item.serviceType} • {new Date(item.createdAt).toLocaleString()}</div>
                {item.user && (<div className="ah-meta">User: {item.user.name || item.user.email || String(item.user)}</div>)}
              </div>
              <div className="ah-image">
                {item.imageUrl ? (<img src={item.imageUrl} alt="upload" />) : (<div className="ah-noimg">No image</div>)}
              </div>
            </div>
            <div className="ah-actions">
              <button className="ah-accept" disabled={item.status==='accepted'} onClick={()=> onAction(item._id, 'accepted')}>Accept</button>
              <button className="ah-reject" disabled={item.status==='rejected'} onClick={()=> onAction(item._id, 'rejected')}>Reject</button>
              <span className={`ah-status ah-${item.status}`}>{item.status}</span>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
