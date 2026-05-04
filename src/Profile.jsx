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
      <div className="profile-card profile-view-mode">
        {/* TOP HEADER: Following the Edit Profile pattern */}
        <div className="profile-view-header">
          <div className="avatar-cluster">
            <img src={user.profilePhoto || "/default-avatar.png"} className="profile-avatar" alt="User" />
            <div className={`status-pill ${user.isApproved ? 'verified' : 'pending'}`}>
              {user.isApproved ? "Verified" : "Pending Audit"}
            </div>
          </div>
          <div className="header-identity">
            <h1>{user.displayName || user.name}</h1>
            <p className="user-role-tag">{user.role?.toUpperCase()} • {user.branch} • {user.passoutYear}</p>
          </div>
        </div>

        <div className="view-content-grid">
          {/* SECTION: GENERAL INFORMATION */}
          <div className="grid-section">
            <h4 className="section-header">General Information</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Father's Name</label>
                <div className="value-box">{user.fatherName || 'N/A'}</div>
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <div className="value-box">
                  {user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <div className="value-box">{user.mobile || 'N/A'}</div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <div className="value-box">{user.email}</div>
              </div>
              <div className="form-group full-width">
                <label>Professional Bio</label>
                <div className="value-box bio-box">{user.bio || "No professional bio added yet."}</div>
              </div>
            </div>
          </div>

          {/* SECTION: ACADEMIC & HOBBIES */}
          <div className="grid-section">
            <h4 className="section-header">Academics & Interests</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>10th Pass-out Year</label>
                <div className="value-box">{user.tenthYear || 'N/A'}</div>
              </div>
              <div className="form-group">
                <label>12th Pass-out Year</label>
                <div className="value-box">{user.twelfthYear || 'N/A'}</div>
              </div>
              <div className="form-group">
                <label>Technical Hobbies</label>
                <div className="tag-flex">
                  {user.hobbiesTechnical?.length > 0 
                    ? user.hobbiesTechnical.map((h, i) => <span key={i} className="mini-tag gold">{h}</span>)
                    : <span className="text-muted">None listed</span>}
                </div>
              </div>
              <div className="form-group">
                <label>Personal Hobbies</label>
                <div className="tag-flex">
                   {user.hobbiesPersonal?.length > 0 
                    ? user.hobbiesPersonal.map((h, i) => <span key={i} className="mini-tag violet">{h}</span>)
                    : <span className="text-muted">None listed</span>}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: ADDRESSES & DOCUMENTS */}
          <div className="grid-section">
            <h4 className="section-header">Addresses & Professional Links</h4>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Current Address</label>
                <div className="value-box">{user.currentAddress || 'N/A'}</div>
              </div>
              <div className="form-group full-width">
                <label>Permanent Address</label>
                <div className="value-box">{user.permanentAddress || 'N/A'}</div>
              </div>
              <div className="form-group">
                <label>LinkedIn</label>
                <div className="value-box">
                  {user.linkedin ? (
                    <a href={ensureAbsoluteUrl(user.linkedin)} target="_blank" rel="noreferrer" className="link-text">
                      View Profile ↗
                    </a>
                  ) : 'N/A'}
                </div>
              </div>
              <div className="form-group">
                <label>Resume</label>
                <div className="value-box">
                  {user.resumeUrl ? (
                    <a href={user.resumeUrl} target="_blank" rel="noreferrer" className="link-text">
                      View PDF ↗
                    </a>
                  ) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

export default Profile;