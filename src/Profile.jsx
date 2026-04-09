import { useState, useRef, useEffect } from 'react';
import EditProfile from './EditProfile';

const getProfileStatus = (user) => {
  const fieldMapping = {
    displayName: 'Display Name', bio: 'Professional Bio', mobile: 'Mobile Number',
    linkedin: 'LinkedIn Link', resumeUrl: 'Resume File', profilePhoto: 'Profile Photo',
    fatherName: "Father's Name", dob: 'Date of Birth', tenthYear: '10th Year',
    twelfthYear: '12th Year', currentAddress: 'Current Address', permanentAddress: 'Permanent Address'
  };
  const missing = Object.keys(fieldMapping).filter(field => !user[field] || user[field] === "");
  const completion = Math.round(((Object.keys(fieldMapping).length - missing.length) / Object.keys(fieldMapping).length) * 100);
  return { percentage: completion, missingNames: missing.map(key => fieldMapping[key]) };
};

function Profile({ user, setUser, setSidebarContent }) {
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

  // This useEffect updates the Sidebar (Left Partition) dynamically
  useEffect(() => {
    const status = getProfileStatus(user);

    setSidebarContent(
      <div className="sidebar-action-group">
        <div className="partition-header">
          <h2>User Profile</h2>
        </div>

        <div className="vertical-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
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
    );

    // Clean up when component unmounts
    return () => setSidebarContent(null);
  }, [isEditing, isOnboarding, user, setSidebarContent]);

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
        setIsEditing(false);
        alert("Profile updated!");
      }
    } catch (err) {
      alert("Error saving profile.");
    }
  };

  if (!user) return <div className="profile-container">Loading...</div>;

  return (
    <div className="profile-content-container">
      {/* Note: The Action Header is removed from here because it's now in the sidebar */}

      {isOnboarding ? (
        <div className="onboarding-wrapper">
          <div className="onboarding-header"><h2>Finish Your Profile</h2></div>
          <form ref={formRef} onSubmit={handleOnboardingSubmit} className="onboarding-form">
            <div className="form-grid">
               <div className="form-group">
                <label>Father's Name</label>
                <input required value={onboardData.fatherName} onChange={e => setOnboardData({ ...onboardData, fatherName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" required value={onboardData.dob} onChange={e => setOnboardData({ ...onboardData, dob: e.target.value })} />
              </div>
              <div className="form-group">
                <label>10th Pass-out Year</label>
                <input type="number" required value={onboardData.tenthYear} onChange={e => setOnboardData({ ...onboardData, tenthYear: e.target.value })} />
              </div>
              <div className="form-group">
                <label>12th Pass-out Year</label>
                <input type="number" required value={onboardData.twelfthYear} onChange={e => setOnboardData({ ...onboardData, twelfthYear: e.target.value })} />
              </div>
              <div className="form-group full-width">
                <label>Current Address</label>
                <textarea required value={onboardData.currentAddress} onChange={e => setOnboardData({ ...onboardData, currentAddress: e.target.value })} />
              </div>
              <div className="form-group full-width">
                <label>Permanent Address</label>
                <textarea required value={onboardData.permanentAddress} onChange={e => setOnboardData({ ...onboardData, permanentAddress: e.target.value })} />
              </div>
            </div>
          </form>
        </div>
      ) : isEditing ? (
        <EditProfile
          user={user}
          ref={formRef} // CORRECT: use the 'ref' prop
          onCancel={() => setIsEditing(false)}
          onUpdate={(updated) => { setUser(updated); setIsEditing(false); }}
        />
      ) : (
  <div className="profile-card">
    <div className="profile-header">
      <img src={user.profilePhoto || "/default-avatar.png"} className="profile-avatar" alt="Profile" />
      <div className="header-text">
        <h1>{user.displayName || user.name}</h1>
        <p className="user-role-tag">{user.role?.toUpperCase()}</p>
      </div>
    </div>

    <div className="profile-body"> {/* Keep this one */}
      <section className="profile-row-group">
        <h4 className="row-title">Documents & Links</h4>
        <div className="grid-info">
          <div className="info-item">
            <label>Resume</label>
            {user.resumeUrl ? (
              <div className="resume-actions" style={{ display: 'flex', gap: '10px' }}>
                <a href={user.resumeUrl} target="_blank" rel="noopener noreferrer" className="link-text">
                  View Resume
                </a>
                <a href={user.resumeUrl} download className="link-text">Download</a>
              </div>
            ) : (
              <span className="text-muted">No resume uploaded</span>
            )}
          </div>
          {user.linkedin && (
            <div className="info-item">
              <label>LinkedIn</label>
              <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="link-text">View Profile</a>
            </div>
          )}
        </div>
      </section>

      {/* REMOVED: the extra <div className="profile-body"> that was here */}
      
      <section className="profile-row-group">
        <h4 className="row-title">Professional Bio</h4>
        <p className="bio-text">{user.bio || "No bio added yet."}</p>
      </section>

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

      <section className="profile-row-group">
        <h4 className="row-title">Academic History</h4>
        <div className="grid-info">
          <div className="info-item"><label>10th Year</label><span>{user.tenthYear}</span></div>
          <div className="info-item"><label>12th Year</label><span>{user.twelfthYear}</span></div>
        </div>
      </section>

      <section className="profile-row-group">
        <h4 className="row-title">Addresses</h4>
        <div className="grid-info">
          <div className="info-item"><label>Current</label><span>{user.currentAddress || 'N/A'}</span></div>
          <div className="info-item"><label>Permanent</label><span>{user.permanentAddress || 'N/A'}</span></div>
        </div>
      </section>
    </div> {/* Close the profile-body here */}
  </div>
)}
    </div>
  );
}

export default Profile;