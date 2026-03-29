import { useState } from 'react';

function AuthHome({ onLogin, onRegister, onAdminLogin }) {
  const [selectedRole, setSelectedRole] = useState('student');
  const [adminPass, setAdminPass] = useState('');

  const handleAdminSubmit = () => {
  if (adminPass === "admin123") {
    onAdminLogin();
  } else {
    alert("Incorrect Admin Password");
  }
};

  return (
    <div className="minimalist-auth-content">
      <h1>MBM Alumni Connect</h1>
      <p className="subtitle">Select your role to get started</p>

      <select 
        className="role-dropdown"
        value={selectedRole} 
        onChange={(e) => setSelectedRole(e.target.value)}
      >
        <option value="student">I am a Student</option>
        <option value="alumni">I am an Alumnus</option>
        <option value="admin">I am an Admin</option>
      </select>

      <div className="auth-actions">
        {selectedRole === 'admin' ? (
          <div style={{ width: '100%' }}>
            <input 
              type="password" 
              placeholder="Enter Admin Password" 
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              style={{ marginBottom: '10px', padding: '12px', width: '100%', borderRadius: '8px', border: '2px solid #e2e8f0' }}
            />
            <button className="secondary-btn full-width" onClick={handleAdminSubmit}>
              Access Admin Dashboard
            </button>
          </div>
        ) : (
          <>
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