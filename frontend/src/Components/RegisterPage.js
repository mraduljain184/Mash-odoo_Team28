import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const API_BASE = process.env.REACT_APP_API_BASE;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("user");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !username || !password || !confirmPassword || !role) {
      alert("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    setLoading(true);
    try {
      const res = await fetch(API_BASE + "/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, name: username.trim().toLowerCase(), role, phone, password })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "Registration failed");
        setLoading(false);
        return;
      }
      localStorage.setItem('pendingVerificationEmail', trimmedEmail);
      navigate("/verify-email");
    } catch (err) {
      alert("Registration error");
    }
    setLoading(false);
  };

  return (
    <div className="login-page sunburst-bg">
      {/* Sunburst decorations (reuse same assets as login) */}
      <div>
        <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754413839/Screenshot_2025-08-05_224001_xuu1go.png" alt="Decoration" className="sunburst" />
      </div>
      <div>
        <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754413503/Vector_h5xttx.png" alt="Decoration" className="sunburst-tr" />
      </div>

      <div className="login-container">
        <div className="login-form-section">
          <div className="institution-logo">
            <img src="odoologo" alt="Institution Logo" className="logo-image" />
          </div>
          <h1 className="login-title">Register</h1>
          <form onSubmit={handleRegister} className="login-form">
            {/* Email */}
            <div className="form-group">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Email"
              />
            </div>
            {/* Username */}
            <div className="form-group">
              <span className="input-icon">👤</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                placeholder="Name"
              />
            </div>
            {/* Role */}
            <div className="form-group">
              <span className="input-icon">🧑‍💼</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-input"
              >
                <option value="user">User</option>
                <option value="worker">Worker</option>
              </select>
            </div>
            {/* Phone */}
            <div className="form-group">
              <span className="input-icon">📱</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                placeholder="Phone"
              />
            </div>
            {/* New Password */}
            <div className="form-group password-group">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="New Password"
                autoComplete="new-password"
              />
              <span
                className="eye-icon"
                onClick={() => setShowPassword((v) => !v)}
                style={{ cursor: 'pointer', marginLeft: 8 }}
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? "👁️" : "👁"}
              </span>
            </div>
            {/* Confirm Password */}
            <div className="form-group password-group">
              <span className="input-icon">🔒</span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Confirm Password"
                autoComplete="new-password"
              />
              <span
                className="eye-icon"
                onClick={() => setShowConfirmPassword((v) => !v)}
                style={{ cursor: 'pointer', marginLeft: 8 }}
                title={showConfirmPassword ? "Hide Password" : "Show Password"}
              >
                {showConfirmPassword ? "👁️" : "👁"}
              </span>
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "REGISTERING..." : "REGISTER"}
            </button>
          </form>
          {/* Login link styled like bottom register link in login page */}
          <div className="register-link-bottom">
            <span>Already Have An Account?</span>
            <span className="register-highlight" onClick={() => navigate("/login")}> LOGIN</span>
          </div>
        </div>
        <div className="hero-banner-section">
          <div className="banner-content">
            <img src="https://res.cloudinary.com/drr1vc8fd/image/upload/v1756538576/PHOTO-2025-08-30-12-51-34_a0ipfd.jpg" alt="Food Illustration" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;