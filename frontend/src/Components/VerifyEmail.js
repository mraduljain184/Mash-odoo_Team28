import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './LoginPage.css';

const API_BASE = process.env.REACT_APP_API_BASE;

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState(localStorage.getItem('pendingVerificationEmail') || '');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Prefill token from URL param if present
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) setToken(urlToken);
  }, [searchParams]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!token || token.length !== 6 || !/^\d+$/.test(token)) {
      setMessage('Please enter a valid 6-digit token');
      setIsSuccess(false);
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(API_BASE + '/api/user/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        setMessage('Email verified successfully! You can now login.');
        localStorage.removeItem('pendingVerificationEmail');
        setTimeout(() => navigate('/login'), 800);
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Verification failed');
      }
    } catch (err) {
      setIsSuccess(false);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      const promptEmail = prompt('Enter your registration email to resend verification token:');
      if (!promptEmail) return;
      setEmail(promptEmail);
      localStorage.setItem('pendingVerificationEmail', promptEmail);
    }
    setResendLoading(true);
    setMessage('');
    try {
      const res = await fetch(API_BASE + '/api/user/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        setMessage('Verification token resent to your email.');
        setCountdown(60); // 60 second cooldown
      } else {
        setIsSuccess(false);
        setMessage(data.message || 'Failed to resend token');
      }
    } catch (err) {
      setIsSuccess(false);
      setMessage('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="login-page sunburst-bg">
      <div>
        <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754413839/Screenshot_2025-08-05_224001_xuu1go.png" alt="Decoration" className="sunburst" />
      </div>
      <div>
        <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754413503/Vector_h5xttx.png" alt="Decoration" className="sunburst-tr" />
      </div>
      <div className="login-container">
        <div className="login-form-section">
          <div className="institution-logo">
            <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754410231/Rajiv_Gandhi_Institute_of_Petroleum_Technology_c3svuc.png" alt="Institution Logo" className="logo-image" />
          </div>
          <h1 className="login-title">Verify Email</h1>
          <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
            Enter the 6-digit verification token sent to your email.
          </p>
          {message && (
            <div style={{
              padding: '10px',
              marginBottom: '20px',
              borderRadius: '5px',
              textAlign: 'center',
              backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
              color: isSuccess ? '#155724' : '#721c24',
              border: `1px solid ${isSuccess ? '#c3e6cb' : '#f5c6cb'}`
            }}>{message}</div>
          )}
          <form onSubmit={handleVerify} className="login-form">
            <div className="form-group">
              <span className="input-icon">🔑</span>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="form-input"
                placeholder="Enter 6-digit token"
                maxLength={6}
                disabled={loading}
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? 'VERIFYING...' : 'VERIFY EMAIL'}
            </button>
          </form>
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <button
              onClick={handleResend}
              disabled={resendLoading || countdown > 0}
              style={{
                background: 'none',
                border: 'none',
                color: '#2c5aa0',
                cursor: resendLoading || countdown > 0 ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
                fontSize: '14px'
              }}
            >
              {resendLoading ? 'RESENDING...' : countdown > 0 ? `RESEND IN ${countdown}s` : 'RESEND TOKEN'}
            </button>
          </div>
          <div className="register-link-bottom">
            <span>Already Verified?</span>
            <span className="register-highlight" onClick={() => navigate('/login')}> LOGIN</span>
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

export default VerifyEmail;