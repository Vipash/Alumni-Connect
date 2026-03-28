import { useState } from 'react';
import EditProfile from './EditProfile';

function Profile({ user, setUser }) {
  const [isEditing, setIsEditing] = useState(false);

  // If the user hasn't completed the mandatory onboarding, force the "Complete Profile" form
  const [isOnboarding, setIsOnboarding] = useState(!user.isProfileComplete);

  const [onboardData, setOnboardData] = useState({
    dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    fatherName: user.fatherName || '',
    tenthYear: user.tenthYear || '',
    twelfthYear: user.twelfthYear || '',
    currentAddress: user.currentAddress || '',
    permanentAddress: user.permanentAddress || '',
    hobbiesTechnical: user.hobbiesTechnical?.join(', ') || '',
    hobbiesPersonal: user.hobbiesPersonal?.join(', ') || '',
  });

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/profile/complete', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          ...onboardData,
          hobbiesTechnical: onboardData.hobbiesTechnical.split(',').map(s => s.trim()),
          hobbiesPersonal: onboardData.hobbiesPersonal.split(',').map(s => s.trim()),
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setIsOnboarding(false);
        alert("Profile verified and completed! Full access granted.");
      }
    } catch (err) {
      alert("Error completing profile. Please try again.");
    }
  };

  if (!user) return <div className="profile-container">Loading...</div>;

  // --- VIEW 1: ONBOARDING / MANDATORY SETUP ---
  if (isOnboarding) {
    return (
      <div className="onboarding-wrapper">
        <div className="onboarding-header">
          <h2>Finish Your Professional Profile</h2>
          <p>Complete these mandatory fields to unlock all features of the MBM Alumni Connect.</p>
        </div>
        <form onSubmit={handleOnboardingSubmit} className="onboarding-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Father's Name</label>
              <input required value={onboardData.fatherName} onChange={e => setOnboardData({...onboardData, fatherName: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" required value={onboardData.dob} onChange={e => setOnboardData({...onboardData, dob: e.target.value})} />
            </div>
            <div className="form-group">
              <label>10th Pass-out Year</label>
              <input type="number" required value={onboardData.tenthYear} onChange={e => setOnboardData({...onboardData, tenthYear: e.target.value})} />
            </div>
            <div className="form-group">
              <label>12th Pass-out Year</label>
              <input type="number" required value={onboardData.twelfthYear} onChange={e => setOnboardData({...onboardData, twelfthYear: e.target.value})} />
            </div>
            <div className="form-group full-width">
              <label>Current Address</label>
              <textarea required value={onboardData.currentAddress} onChange={e => setOnboardData({...onboardData, currentAddress: e.target.value})} />
            </div>
            <div className="form-group full-width">
              <label>Permanent Address</label>
              <textarea required value={onboardData.permanentAddress} onChange={e => setOnboardData({...onboardData, permanentAddress: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Technical Hobbies (comma separated)</label>
              <input value={onboardData.hobbiesTechnical} onChange={e => setOnboardData({...onboardData, hobbiesTechnical: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Personal Hobbies (comma separated)</label>
              <input value={onboardData.hobbiesPersonal} onChange={e => setOnboardData({...onboardData, hobbiesPersonal: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="complete-profile-btn">Unlock All Features</button>
        </form>
      </div>
    );
  }

  // --- VIEW 2: EDITING MODE ---
  if (isEditing) {
    return (
      <EditProfile 
        user={user} 
        onCancel={() => setIsEditing(false)} 
        onUpdate={(updated) => { setUser(updated); setIsEditing(false); }} 
      />
    );
  }

  // --- VIEW 3: STANDARD PROFILE VIEW ---
  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="avatar-wrapper">
          <img 
            src={user.profilePhoto || "/default-avatar.png"} 
            alt="Profile" 
            onError={(e) => { e.target.src = "/default-avatar.png"; }}
            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
          />
        </div>
        <div className="header-text">
          <h1>{user.displayName || user.name}</h1>
          <p className="user-role-tag">{user.role.toUpperCase()}</p>
          <div className="social-links">
            {user.linkedin && (
              <a href={user.linkedin} target="_blank" rel="noreferrer" className="social-icon linkedin">
                LinkedIn 🔗
              </a>
            )}
            {user.resumeUrl && (
              <a href={user.resumeUrl} target="_blank" rel="noopener noreferrer" className="social-icon resume">
                View Resume
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="profile-body">
        <section className="profile-section">
          <h3>About Me</h3>
          <p className="bio-text">{user.bio || "No bio added yet."}</p>
        </section>

        <section className="profile-section grid-info">
          {/* Previous fields */}
          <div className="info-item"><label>Email</label><span>{user.email}</span></div>
          <div className="info-item"><label>Branch</label><span>{user.branch}</span></div>
          <div className="info-item"><label>Batch</label><span>{user.passoutYear}</span></div>
          
          {/* New detailed fields */}
          <div className="info-item"><label>Father's Name</label><span>{user.fatherName}</span></div>
          <div className="info-item"><label>DOB</label><span>{new Date(user.dob).toLocaleDateString()}</span></div>
          <div className="info-item"><label>10th/12th Batch</label><span>{user.tenthYear} / {user.twelfthYear}</span></div>
          
          <div className="info-item full-width"><label>Current Address</label><span>{user.currentAddress}</span></div>
          
          <div className="info-item">
            <label>Technical Hobbies</label>
            <div className="tags">
              {user.hobbiesTechnical?.map(h => <span key={h} className="tag tech-tag">{h}</span>)}
            </div>
          </div>
          <div className="info-item">
            <label>Personal Hobbies</label>
            <div className="tags">
              {user.hobbiesPersonal?.map(h => <span key={h} className="tag personal-tag">{h}</span>)}
            </div>
          </div>
        </section>
      </div>

      <div className="profile-footer">
        <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
          Edit Profile Details
        </button>
      </div>
    </div>
  );
}

export default Profile;