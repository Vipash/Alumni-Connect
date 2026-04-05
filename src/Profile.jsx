import { useState, useRef } from 'react';
import EditProfile from './EditProfile';

// Helper function moved outside to prevent re-creation on every render
const getProfileStatus = (user) => {
  const fieldMapping = {
    displayName: 'Display Name', bio: 'Professional Bio', mobile: 'Mobile Number',
    linkedin: 'LinkedIn Link', resumeUrl: 'Resume File', profilePhoto: 'Profile Photo',
    fatherName: 'Father\'s Name', dob: 'Date of Birth', tenthYear: '10th Year',
    twelfthYear: '12th Year', currentAddress: 'Current Address', permanentAddress: 'Permanent Address'
  };
  const missing = Object.keys(fieldMapping).filter(field => !user[field] || user[field] === "");
  const completion = Math.round(((Object.keys(fieldMapping).length - missing.length) / Object.keys(fieldMapping).length) * 100);
  return { percentage: completion, missingNames: missing.map(key => fieldMapping[key]) };
};

function Profile({ user, setUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(!user.isProfileComplete);
  const formRef = useRef(null);

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
        alert("Profile completed!");
      }
    } catch (err) {
      alert("Error completing profile.");
    }
  };

  if (!user) return <div className="profile-container">Loading...</div>;

  const status = getProfileStatus(user);

  return (
    <div className="portal-main-partition">
      {/* --- LEFT PARTITION --- */}
      <div className="partition-left">
        <div className="partition-header">
          <h2>User Profile</h2>
        </div>

        <div className="sidebar-action-group">
          {!isEditing && !isOnboarding ? (
            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          ) : (
            <>
              <button className="update-btn" onClick={() => formRef.current?.requestSubmit()}>
                {isOnboarding ? "Verify & Save" : "Update Changes"}
              </button>
              {!isOnboarding && (
                <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              )}
            </>
          )}
        </div>

        <div className="progress-container sidebar-progress" style={{ marginTop: '30px' }}>
          <div className="progress-label">Completion: {status.percentage}%</div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${status.percentage}%` }}></div>
          </div>
        </div>
      </div>

      {/* --- RIGHT PARTITION --- */}
      <div className="partition-right">
        <div className="tab-render-container" style={{ overflowY: 'auto', padding: '2rem' }}>
          
          {isOnboarding ? (
            <div className="onboarding-wrapper">
              <div className="onboarding-header"><h2>Finish Your Profile</h2></div>
              <form ref={formRef} onSubmit={handleOnboardingSubmit} className="onboarding-form">
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
       </form>
      </div>
   ) : isEditing ? (
            <EditProfile 
              user={user} 
              formRef={formRef} 
              onCancel={() => setIsEditing(false)} 
              onUpdate={(updated) => { setUser(updated); setIsEditing(false); }} 
            />
          ) : (
            /* VIEW MODE: Standard Profile Card */
            <div className="profile-card">
              <div className="profile-header">
                <img src={user.profilePhoto || "/default-avatar.png"} className="profile-avatar" alt="Profile" />
                <div className="header-text">
                  <h1>{user.displayName || user.name}</h1>
                  <p className="user-role-tag">{user.role.toUpperCase()}</p>
                </div>
              </div>
              <div className="profile-body">
        {/* ROW 1: ABOUT */}
        <section className="profile-row-group">
          <h4 className="row-title">Professional Bio</h4>
          <p className="bio-text">{user.bio || "No bio added yet."}</p>
        </section>

        {/* ROW 2: CORE DETAILS */}
        <section className="profile-row-group">
          <h4 className="row-title">Basic Information</h4>
          <div className="grid-info">
            <div className="info-item"><label>Email</label><span>{user.email}</span></div>
            <div className="info-item"><label>Mobile</label><span>{user.mobile || 'N/A'}</span></div>
            <div className="info-item"><label>Branch</label><span>{user.branch}</span></div>
            <div className="info-item"><label>Batch</label><span>{user.passoutYear}</span></div>
            <div className="info-item"><label>Father's Name</label><span>{user.fatherName}</span></div>
            <div className="info-item"><label>DOB</label><span>{user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'}</span></div>
          </div>
        </section>

        {/* ROW 3: ACADEMIC HISTORY */}
        <section className="profile-row-group">
          <h4 className="row-title">Academic History</h4>
          <div className="grid-info">
            <div className="info-item"><label>10th Passout Year</label><span>{user.tenthYear}</span></div>
            <div className="info-item"><label>12th Passout Year</label><span>{user.twelfthYear}</span></div>
          </div>
        </section>

        {/* ROW 4: ADDRESSES */}
        <section className="profile-row-group">
                  <h4 className="row-title">Professional Bio</h4>
                  <p className="bio-text">{user.bio || "No bio added yet."}</p>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;