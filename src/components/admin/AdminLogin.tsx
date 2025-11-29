import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, Clock, Shield } from 'lucide-react';
import { useAuth } from '../../state';

const AdminLogin: React.FC = () => {
  const { login, failedAttempts, isLockedOut, getRemainingLockoutTime } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Update lockout countdown
  useEffect(() => {
    if (isLockedOut()) {
      const interval = setInterval(() => {
        const remaining = getRemainingLockoutTime();
        setLockoutTime(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          setError('');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLockedOut, getRemainingLockoutTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (isLockedOut()) {
      setError(`Account locked. Please wait ${getRemainingLockoutTime()} seconds.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(password);
      // Login successful - component will unmount as user is now authenticated
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setPassword(''); // Clear password on failed attempt
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1>
            <Lock size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            Admin
          </h1>
          <p className="page-subtitle">Secure access to the management panel</p>
        </div>
      </div>

      {/* Login Card */}
      <div className="page-content">
        <div className="admin-login-card">
          <div className="login-header">
            <div className="login-icon">
              {isLockedOut() ? <Clock size={32} /> : <Shield size={32} />}
            </div>
            <h2>Admin Access</h2>
            {isLockedOut() ? (
              <p className="lockout-message">
                Account temporarily locked. Please wait {lockoutTime} seconds.
              </p>
            ) : (
              <p>Enter your admin password to access the management panel</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="admin-password">Admin Password</label>
              <div className="password-input-container">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter admin password"
                  className={`form-input ${error ? 'input-error' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading || !password.trim() || isLockedOut()}
            >
              {loading ? (
                <div className="loading-spinner small" />
              ) : isLockedOut() ? (
                <>
                  <Clock size={16} />
                  Locked ({lockoutTime}s)
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Access Admin Panel
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            {failedAttempts > 0 && !isLockedOut() && (
              <div className="attempts-warning">
                <Shield size={14} />
                <span>{failedAttempts}/5 failed attempts</span>
              </div>
            )}
            <p className="login-hint">
              Default password: <code>bbdladmin2025</code>
            </p>
            <small className="security-note">
              Note: This is a front-end only authentication for demonstration purposes.
              In production, this would be replaced with secure server-side authentication.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
