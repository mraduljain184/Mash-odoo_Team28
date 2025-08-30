import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const API_BASE = process.env.REACT_APP_API_BASE;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Please enter your email address");
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch(API_BASE + "/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setIsSuccess(true);
        setMessage(data.message);
        setTimeout(() => {
          navigate("/reset-password");
        }, 3000);
      } else {
        setIsSuccess(false);
        setMessage(data.message || "Failed to send reset email");
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
      <div>
        <img 
          src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754413839/Screenshot_2025-08-05_224001_xuu1go.png" 
          alt="Logo" 
          className="sunburst" 
        />
      </div>
      <div>
        <img 
          src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754413503/Vector_h5xttx.png" 
          alt="Logo" 
          className="sunburst-tr" 
        />
      </div>
      
      <div className="login-container">
        <div className="login-form-section">
          <div className="institution-logo">
            <img 
              src="https://res.cloudinary.com/drr1vc8fd/image/upload/v1756541360/favpng_5276fa520b56c455881b4dbef71a90dc_eljvsp.png" 
              alt="Logo" 
              className="logo-image" 
            />
          </div>
          <h1 className="login-title">Forgot Password</h1>
          <p style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}>
            Enter your email address and we'll send you a reset token
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
              <span className="input-icon">📧</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email address"
                disabled={isLoading}
              />
            </div>
            
            <button 
              type="submit" 
              className="login-btn"
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? "SENDING..." : "SEND RESET TOKEN"}
            </button>
          </form>

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
              src="https://res.cloudinary.com/drr1vc8fd/image/upload/v1756538576/PHOTO-2025-08-30-12-51-34_a0ipfd.jpg" 
              alt="Food Illustration" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;