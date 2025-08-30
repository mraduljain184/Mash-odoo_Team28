import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css"; // Using the same CSS as LoginPage

const API_BASE = process.env.REACT_APP_API_BASE;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    token: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.token || !formData.newPassword || !formData.confirmPassword) {
      setMessage("Please fill in all fields");
      setIsSuccess(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      setIsSuccess(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage("Password must be at least 6 characters long");
      setIsSuccess(false);
      return;
    }

    if (formData.token.length !== 6 || !/^\d+$/.test(formData.token)) {
      setMessage("Token must be a 6-digit number");
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch(API_BASE + "/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: formData.token,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsSuccess(true);
        setMessage(data.message);
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setIsSuccess(false);
        setMessage(data.message || "Failed to reset password");
      }
    } catch (err) {
      setIsSuccess(false);
      setMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page sunburst-bg">
      {/* Sunburst decorations */}
      <div>
        <img 
          src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754413839/Screenshot_2025-08-05_224001_xuu1go.png" 
          alt="Institution Logo" 
          className="sunburst" 
        />
      </div>
      <div>
        <img 
          src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754413503/Vector_h5xttx.png" 
          alt="Institution Logo" 
          className="sunburst-tr" 
        />
      </div>
      
      <div className="login-container">
        <div className="login-form-section">
          <div className="institution-logo">
            <img 
              src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754410231/Rajiv_Gandhi_Institute_of_Petroleum_Technology_c3svuc.png" 
              alt="Institution Logo" 
              className="logo-image" 
            />
          </div>
          <h1 className="login-title">Reset Password</h1>
          <p style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}>
            Enter the token sent to your email and set a new password
          </p>
          
          {message && (
            <div 
              style={{
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "5px",
                textAlign: "center",
                backgroundColor: isSuccess ? "#d4edda" : "#f8d7da",
                color: isSuccess ? "#155724" : "#721c24",
                border: `1px solid ${isSuccess ? "#c3e6cb" : "#f5c6cb"}`
              }}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <span className="input-icon">🔑</span>
              <input
                type="text"
                name="token"
                value={formData.token}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter 6-digit token from email"
                maxLength="6"
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="New Password (min 6 characters)"
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="Confirm New Password"
                disabled={isLoading}
              />
            </div>
            
            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? "RESETTING..." : "RESET PASSWORD"}
            </button>
          </form>

          {/* Back to login link */}
          <div className="register-link-bottom">
            <span>Remember your password?</span>
            <span 
              className="register-highlight" 
              onClick={() => navigate("/login")}
            >
              {" "}BACK TO LOGIN
            </span>
          </div>
        </div>
        
        <div className="hero-banner-section">
          <div className="banner-content">
            <img 
              src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754415310/WhatsApp_Image_2025-08-05_at_10.34.36_PM_t2xrzr.jpg" 
              alt="Food Illustration" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;