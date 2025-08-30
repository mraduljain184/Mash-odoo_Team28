import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { useAuth } from '../auth/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE;

const LoginPage = ({ setUser }) => {
  const navigate = useNavigate();
  const { setUser: setAuthUser } = useAuth();
  const [userType, setUserType] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const goto = (path) => {
    try { navigate(path, { replace: true }); } catch {}
    try { window.location.replace(path); } catch {}
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (
      (userType === "user" || userType === "worker") &&
      (!email || !password)
    ) {
      alert("Please fill in all fields");
      return;
    }
    if (userType === "admin" && (!adminName || !adminPassword)) {
      alert("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      const isAdmin = userType === "admin";
      const isWorker = userType === "worker";
      const url = isAdmin
        ? "/api/auth/admin/login"
        : isWorker
          ? "/api/auth/worker/login"
          : "/api/auth/user/login";
      const body = isAdmin
        ? { username: adminName.trim().toLowerCase(), password: adminPassword }
        : { email: email.trim().toLowerCase(), password };
      const res = await fetch(API_BASE + url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        if (
          res.status === 403 &&
          data.message &&
          data.message.toLowerCase().includes("verify")
        ) {
          localStorage.setItem(
            "pendingVerificationEmail",
            (email || "").trim().toLowerCase()
          );
          alert(
            "Email not verified. Please enter the token sent to your email."
          );
          goto("/verify-email");
          setLoading(false);
          return;
        }
        alert(data.message || "Login failed");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", data.token);
      const payloadUser = isAdmin
        ? data.data
        : { ...data.data, email: (email || "").trim().toLowerCase() };
      localStorage.setItem("user", JSON.stringify(payloadUser));

      // Immediately update AuthContext so guards pass
      try { setAuthUser && setAuthUser({ ...payloadUser, token: data.token }); } catch {}

      // Backward compatibility with any legacy state
      setUser && setUser(payloadUser);

      if (isAdmin) return goto('/admin');
      if (isWorker || payloadUser.role === 'worker') {
        try {
          const token = localStorage.getItem('token');
          const res2 = await fetch(`${API_BASE}/api/workshops/me/own`, { headers: { Authorization: `Bearer ${token}` } });
          const json2 = await res2.json();
          return goto(json2.success && json2.data ? '/worker/dashboard' : '/worker/workshop/new');
        } catch {
          return goto('/worker/workshop/new');
        }
      }
      goto('/');
    } catch (err) {
      alert("Login error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page sunburst-bg">
      <div>
        <img
          src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754413839/Screenshot_2025-08-05_224001_xuu1go.png"
          alt="Institution Logo"
          className="sunburst"
        />
      </div>
      <div>
        <img src="odoolog" alt="Institution Logo" className=" sunburst-tr" />
      </div>
      <div className="login-container">
        <div className="login-form-section">
          <div className="institution-logo">
            <img src="https://res.cloudinary.com/drr1vc8fd/image/upload/v1756541360/favpng_5276fa520b56c455881b4dbef71a90dc_eljvsp.png" alt="Institution Logo" className="logo-image" />
          </div>
          <h1 className="login-title">Login</h1>
          <div className="user-type-selection-pill">
            <button
              type="button"
              className={`pill-btn${userType === "user" ? " active" : ""}`}
              onClick={() => setUserType("user")}
            >
              User Login
            </button>
            <button
              type="button"
              className={`pill-btn${userType === "worker" ? " active" : ""}`}
              onClick={() => setUserType("worker")}
            >
              Worker Login
            </button>
            <button
              type="button"
              className={`pill-btn${userType === "admin" ? " active" : ""}`}
              onClick={() => setUserType("admin")}
            >
              Admin Login
            </button>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            {userType === "admin" ? (
              <>
                <div className="form-group">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="form-input"
                    placeholder="Username"
                  />
                </div>
                <div className="form-group">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="form-input"
                    placeholder="Password"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="Registered Email"
                  />
                </div>
                <div className="form-group">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="Password"
                  />
                </div>
              </>
            )}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>
          {/* Forgot Password Link for non-admin */}
          {userType !== "admin" && (
            <div style={{ textAlign: "right", marginBottom: "10px" }}>
              <span
                style={{
                  color: "#2c5aa0",
                  cursor: "pointer",
                  fontSize: "14px",
                  textDecoration: "underline",
                }}
                onClick={() => {
                  navigate("/forgot-password");
                }}
              >
                Forgot Password?
              </span>
            </div>
          )}
          {/* Register link at the bottom left */}
          <div className="register-link-bottom">
            <span>Don't Have An Account?</span>
            <span
              className="register-highlight"
              onClick={() => navigate("/register")}
            >
              {" "}
              REGISTER
            </span>
          </div>
        </div>
        <div className="hero-banner-section">
          <div className="banner-content">
            <img
              src="https://res.cloudinary.com/drr1vc8fd/image/upload/v1756538576/PHOTO-2025-08-30-12-51-34_a0ipfd.jpg"
              alt="Food Illustration"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
