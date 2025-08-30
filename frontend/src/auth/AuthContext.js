import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || '';

const AuthContext = createContext({ user: null, ready: false });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function validate() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          if (!cancelled) { setUser(null); setReady(true); }
          return;
        }
        const res = await fetch(`${API_BASE}/api/auth/validate`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (!cancelled) {
          if (json?.success) {
            setUser({ ...json.data, token });
          } else {
            // invalid token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
          setReady(true);
        }
      } catch {
        if (!cancelled) { setUser(null); setReady(true); }
      }
    }
    validate();
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(() => ({ user, setUser, ready }), [user, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
