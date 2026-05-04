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
  <div className="profile-card profile-view-wide">
    {/* 1. TOP IDENTITY STRIP */}
    <div className="profile-view-header">
      <div className="avatar-side">
        <img src={user.profilePhoto || "/default-avatar.png"} className="profile-avatar" alt="User" />
        <div className={`status-pill ${user.isApproved ? 'verified' : 'pending'}`}>
          {user.isApproved ? "Verified Member" : "Pending Verification"}
        </div>
      </div>
      <div className="identity-side">
        <h1>{user.displayName || user.name}</h1>
        <div className="badge-row">
          <span className="info-badge role">{user.role?.toUpperCase()}</span>
          <span className="info-badge branch">{user.branch}</span>
          <span className="info-badge year">Batch of {user.passoutYear}</span>
        </div>
      </div>
    </div>

    <div className="profile-view-grid">
      {/* 2. CORE INFORMATION (Left Column) */}
      <div className="view-column">
        <h4 className="column-label">Identity & Contact</h4>
        <div className="data-box-grid">
          <div className="data-field">
            <label>Father's Name</label>
            <div className="static-value">{user.fatherName || '—'}</div>
          </div>
          <div className="data-field">
            <label>Date of Birth</label>
            <div className="static-value">
              {user.dob ? new Date(user.dob).toLocaleDateString() : '—'}
            </div>
          </div>
          <div className="data-field">
            <label>Mobile</label>
            <div className="static-value">{user.mobile || '—'}</div>
          </div>
          <div className="data-field">
            <label>Email</label>
            <div className="static-value email-val">{user.email}</div>
          </div>
        </div>
      </div>

      {/* 3. ACADEMICS & INTERESTS (Middle Column) */}
      <div className="view-column">
        <h4 className="column-label">Academic & Interests</h4>
        <div className="data-box-grid">
          <div className="data-field half">
            <label>10th Year</label>
            <div className="static-value">{user.tenthYear || '—'}</div>
          </div>
          <div className="data-field half">
            <label>12th Year</label>
            <div className="static-value">{user.twelfthYear || '—'}</div>
          </div>
          <div className="data-field">
            <label>Technical Hobbies</label>
            <div className="tag-group">
              {user.hobbiesTechnical?.length > 0 
                ? user.hobbiesTechnical.map((h, i) => <span key={i} className="v-tag gold">{h}</span>)
                : <span className="empty-text">No technical tags added</span>}
            </div>
          </div>
          <div className="data-field">
            <label>Personal Hobbies</label>
            <div className="tag-group">
              {user.hobbiesPersonal?.length > 0 
                ? user.hobbiesPersonal.map((h, i) => <span key={i} className="v-tag violet">{h}</span>)
                : <span className="empty-text">No personal tags added</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 4. BIO & ADDRESSES (Full Width / Right Span) */}
      <div className="view-column span-full">
        <h4 className="column-label">Bio & Residential Registry</h4>
        <div className="data-box-grid">
          <div className="data-field full">
            <label>Professional Bio</label>
            <div className="static-value bio-display">{user.bio || "No professional statement provided."}</div>
          </div>
          <div className="data-row-flex">
            <div className="data-field">
              <label>Current Address</label>
              <div className="static-value address-display">{user.currentAddress || '—'}</div>
            </div>
            <div className="data-field">
              <label>Permanent Address</label>
              <div className="static-value address-display">{user.permanentAddress || '—'}</div>
            </div>
          </div>
          <div className="data-row-flex">
            <div className="data-field">
              <label>LinkedIn</label>
              <div className="static-value">
                {user.linkedin ? (
                  <a href={ensureAbsoluteUrl(user.linkedin)} target="_blank" rel="noreferrer" className="action-link">
                    External Profile ↗
                  </a>
                ) : 'Not Linked'}
              </div>
            </div>
            <div className="data-field">
              <label>Resume</label>
              <div className="static-value">
                {user.resumeUrl ? (
                  <a href={user.resumeUrl} target="_blank" rel="noreferrer" className="action-link">
                    Download PDF ↗
                  </a>
                ) : 'Not Uploaded'}
              </div>
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