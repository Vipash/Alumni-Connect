import { useState } from 'react';

function AuthHome({ onLogin, onRegister, onAdminLogin }) {
  const [selectedRole, setSelectedRole] = useState('student');

  return (
    <div className="modal-box minimalist-auth">
      <div className="logo-section">
        <img src="/MBM_Logo.png" alt="MBM Logo" style={{ width: '180px' }} />
      </div>
      
      <h1>MBM Alumni Connect</h1>
      <p className="subtitle">Select your role to get started</p>

      {/* FIELD 1: ROLE DROPDOWN */}
      <div className="form-group">
        <select 
          className="role-dropdown"
          value={selectedRole} 
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="student">I am a Student</option>
          <option value="alumni">I am an Alumnus</option>
          <option value="admin">I am an Admin</option>
        </select>
      </div>

      <div className="auth-actions">
        {selectedRole === 'admin' ? (
          /* FIELD 2: ADMIN SIGN IN */
          <button className="primary-btn full-width" onClick={onAdminLogin}>
            Sign In as Admin
          </button>
        ) : (
          <>
            {/* FIELD 2 & 3: LOGIN / REGISTER */}
            <button className="secondary-btn" onClick={() => onLogin(selectedRole)}>
              Sign In
            </button>
            <button className="primary-btn" onClick={() => onRegister(selectedRole)}>
              Register
            </button>
          </>
        )}
      </div>
    </div>
  );
}
export default AuthHome;