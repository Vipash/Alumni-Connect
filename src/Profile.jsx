import { useState, useRef, useEffect } from 'react';
import EditProfile from './EditProfile';
import './Profile.css';

const ensureAbsoluteUrl = (url) => {
  if (!url) return "#";
  // If it doesn't start with http, prepend https://
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

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
  
  // Logical Constraints
  const currentYear = new Date().getFullYear();
  const tYear = parseInt(onboardData.tenthYear);
  const wYear = parseInt(onboardData.twelfthYear);
  const birthYear = new Date(onboardData.dob).getFullYear();

  // 1. Check for missing fields (Browser 'required' handles most, but we double check)
  if (!onboardData.fatherName || !onboardData.dob || !onboardData.currentAddress) {
    alert("Please fill all required fields.");
    return;
  }

  // 2. Year Logic
  if (tYear < 1950 || tYear > currentYear) {
    alert("Invalid 10th Pass-out Year.");
    return;
  }
  if (wYear <= tYear) {
    alert("12th Pass-out Year must be after 10th Pass-out Year.");
    return;
  }
  if (tYear - birthYear < 10) {
    alert("Please check your Date of Birth and 10th Pass-out Year logic.");
    return;
  }

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
  <div className="profile-dashboard-wrapper">
    {isOnboarding ? (
       {/* ... keep onboarding form as is ... */}
    ) : isEditing ? (
      <EditProfile 
        user={user} 
        ref={formRef} 
        onCancel={() => setIsEditing(false)} 
        onUpdate={(updated) => { setUser(updated); setIsEditing(false); }} 
      />
    ) : (
      <div className="modern-profile-card">
        {/* 1. Profile Hero Section */}
        <div className="profile-hero-banner">
          <div className="profile-avatar-wrapper">
            <img 
              src={user.profilePhoto || "/default-avatar.png"} 
              className="main-avatar" 
              alt="Profile" 
            />
            <div className={`status-indicator ${user.isApproved ? 'active' : 'pending'}`}></div>
          </div>
          <div className="hero-identity">
            <h1>{user.displayName || user.name}</h1>
            <div className="identity-tags">
              <span className="role-badge">{user.role?.toUpperCase()}</span>
              <span className="branch-badge">{user.branch} • Class of {user.passoutYear}</span>
            </div>
          </div>
        </div>

        <div className="profile-grid-layout">
          {/* 2. Left Column: Summary & Links */}
          <div className="profile-aside">
            <div className="info-card-mini">
              <h4>Contact Assets</h4>
              <div className="asset-links">
                {user.resumeUrl ? (
                  <a href={user.resumeUrl} target="_blank" rel="noreferrer" className="asset-btn resume">
                    <span className="icon">📄</span> Curriculum Vitae
                  </a>
                ) : (
                  <div className="asset-btn disabled">No Resume Provided</div>
                )}
                {user.linkedin && (
                  <a href={ensureAbsoluteUrl(user.linkedin)} target="_blank" rel="noreferrer" className="asset-btn linkedin">
                    <span className="icon">🔗</span> LinkedIn Profile
                  </a>
                )}
              </div>
            </div>

            <div className="info-card-mini">
              <h4>Quick Stats</h4>
              <div className="stat-row">
                <span>Member Status</span>
                <b className={user.isApproved ? "text-success" : "text-warning"}>
                  {user.isApproved ? "Verified" : "Pending Audit"}
                </b>
              </div>
              <div className="stat-row">
                <span>Account Type</span>
                <b>Official Member</b>
              </div>
            </div>
          </div>

          {/* 3. Right Column: Detailed Info Sections */}
          <div className="profile-main-body">
            <section className="detail-section">
              <h3 className="section-heading">Professional Statement</h3>
              <p className="bio-paragraph">{user.bio || "This user prefers to keep their professional mystery. No bio added yet."}</p>
            </section>

            <section className="detail-section">
              <h3 className="section-heading">Personal & Academic Portfolio</h3>
              <div className="data-table">
                <div className="data-row">
                  <div className="data-cell">
                    <label>Email Address</label>
                    <span>{user.email}</span>
                  </div>
                  <div className="data-cell">
                    <label>Primary Phone</label>
                    <span>{user.mobile || 'Not Disclosed'}</span>
                  </div>
                </div>
                <div className="data-row">
                  <div className="data-cell">
                    <label>Guardian Name</label>
                    <span>{user.fatherName}</span>
                  </div>
                  <div className="data-cell">
                    <label>Birth Date</label>
                    <span>{user.dob ? new Date(user.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</span>
                  </div>
                </div>
                <div className="data-row">
                  <div className="data-cell">
                    <label>Secondary Education (10th)</label>
                    <span>Class of {user.tenthYear}</span>
                  </div>
                  <div className="data-cell">
                    <label>Higher Secondary (12th)</label>
                    <span>Class of {user.twelfthYear}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="detail-section">
              <h3 className="section-heading">Residential Registry</h3>
              <div className="address-grid">
                <div className="address-box">
                  <label>Current Mailing Address</label>
                  <p>{user.currentAddress || 'No address on file.'}</p>
                </div>
                <div className="address-box">
                  <label>Permanent Residence</label>
                  <p>{user.permanentAddress || 'Same as current.'}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

export default Profile;