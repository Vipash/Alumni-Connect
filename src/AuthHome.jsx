import { useState } from 'react';

function AuthHome({ onLoginClick, onRegisterClick }) {
  const [role, setRole] = useState('student');

  return (
    <div className="landing-auth-container">
      <div className="minimal-auth-card">
        <h1 className="portal-logo">MBM Connect</h1>
        <p className="portal-subtitle">Select your role to continue</p>

        {/* FIELD 1: ROLE SELECT */}
        <div className="auth-field-group">
          <select 
            className="minimal-select"
            value={role} 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="student">I am a Student</option>
            <option value="alumni">I am an Alumni</option>
            <option value="admin">I am an Administrator</option>
          </select>
        </div>

        {/* FIELDS 2 & 3: ACTION BUTTONS */}
        <div className="auth-action-row">
          {role === 'admin' ? (
            <button 
              className="primary-auth-btn full-width" 
              onClick={() => onLoginClick(role)}
            >
              Sign In to Dashboard
            </button>
          ) : (
            <>
              <button 
                className="secondary-auth-btn" 
                onClick={() => onLoginClick(role)}
              >
                Login
              </button>
              <button 
                className="primary-auth-btn" 
                onClick={() => onRegisterClick(role)}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}