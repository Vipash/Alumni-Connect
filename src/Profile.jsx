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
    displayName: 'Display Name',
    bio: 'Professional Bio',
    mobile: 'Mobile Number',
    linkedin: 'LinkedIn Link',
    resumeUrl: 'Resume File',
    profilePhoto: 'Profile Photo',
    fatherName: "Father's Name",
    dob: 'Date of Birth',
    tenthYear: '10th Year',
    twelfthYear: '12th Year',
    currentAddress: 'Current Address',
    permanentAddress: 'Permanent Address',
  };

  const missing = Object.keys(fieldMapping).filter(
    (field) => !user[field] || user[field] === ""
  );

  const completion = Math.round(
    ((Object.keys(fieldMapping).length - missing.length) /
      Object.keys(fieldMapping).length) *
      100
  );

  return {
    percentage: completion,
    missingNames: missing.map((key) => fieldMapping[key]),
  };
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

  // Sidebar (left partition) dynamic content
  useEffect(() => {
    const status = getProfileStatus(user);

    setSidebarContent(
      <div className="sidebar-action-group">
        <div className="partition-header">
          <h2>User Profile</h2>
        </div>

        <div
          className="vertical-actions"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginTop: '20px',
          }}
        >
          {!isEditing && !isOnboarding ? (
            <button
              className="edit-profile-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                className="update-btn"
                onClick={() => formRef.current?.requestSubmit()}
              >
                {isOnboarding ? 'Verify & Save' : 'Update Changes'}
              </button>
              {!isOnboarding && (
                <button
                  className="cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>

        <div
          className="progress-container sidebar-progress"
          style={{ marginTop: '30px' }}
        >
          <div className="progress-label">
            Completion: {status.percentage}%
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${status.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    );

    // Clean up when component unmounts
    return () => setSidebarContent(null);
  }, [isEditing, isOnboarding, user, setSidebarContent]);

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();

    const currentYear = new Date().getFullYear();
    const tYear = parseInt(onboardData.tenthYear);
    const wYear = parseInt(onboardData.twelfthYear);
    const birthYear = new Date(onboardData.dob).getFullYear();

    // 1. Required-field check
    if (!onboardData.fatherName || !onboardData.dob || !onboardData.currentAddress) {
      alert('Please fill all required fields.');
      return;
    }

    // 2. Year logic checks
    if (tYear < 1950 || tYear > currentYear) {
      alert('Invalid 10th Pass-out Year.');
      return;
    }
    if (wYear <= tYear) {
      alert('12th Pass-out Year must be after 10th Pass-out Year.');
      return;
    }
    if (tYear - birthYear < 10) {
      alert('Please check your Date of Birth and 10th Pass-out Year logic.');
      return;
    }

    try {
      const res = await fetch('/api/profile/complete', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          ...onboardData,
          hobbiesTechnical: onboardData.hobbiesTechnical
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          hobbiesPersonal: onboardData.hobbiesPersonal
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setIsOnboarding(false);
        setIsEditing(false);
        alert('Profile updated!');
      } else {
        alert('Error saving profile.');
      }
    } catch (err) {
      alert('Error saving profile.');
    }
  };

  if (!user) return <div className="profile-container">Loading...</div>;

  return (
    <div className="profile-dashboard-wrapper">
      {isOnboarding ? (
        // Onboarding form (kept, but not expanded here as per your note)
        <div className="onboarding-wrapper">
          <div className="onboarding-header">
            <h2>Complete Your Profile</h2>
            <p>Please provide the following details to finish your onboarding.</p>
          </div>

          <form className="onboarding-form" onSubmit={handleOnboardingSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Father&apos;s Name</label>
                <input
                  type="text"
                  value={onboardData.fatherName}
                  onChange={(e) =>
                    setOnboardData({ ...onboardData, fatherName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={onboardData.dob}
                  onChange={(e) =>
                    setOnboardData({ ...onboardData, dob: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>10th Pass-out Year</label>
                <input
                  type="number"
                  value={onboardData.tenthYear}
                  onChange={(e) =>
                    setOnboardData({ ...onboardData, tenthYear: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>12th Pass-out Year</label>
                <input
                  type="number"
                  value={onboardData.twelfthYear}
                  onChange={(e) =>
                    setOnboardData({ ...onboardData, twelfthYear: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Current Address</label>
                <textarea
                  value={onboardData.currentAddress}
                  onChange={(e) =>
                    setOnboardData({ ...onboardData, currentAddress: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Permanent Address</label>
                <textarea
                  value={onboardData.permanentAddress}
                  onChange={(e) =>
                    setOnboardData({
                      ...onboardData,
                      permanentAddress: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group full-width">
                <label>Technical Hobbies (comma-separated)</label>
                <input
                  type="text"
                  value={onboardData.hobbiesTechnical}
                  onChange={(e) =>
                    setOnboardData({
                      ...onboardData,
                      hobbiesTechnical: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group full-width">
                <label>Personal Hobbies (comma-separated)</label>
                <input
                  type="text"
                  value={onboardData.hobbiesPersonal}
                  onChange={(e) =>
                    setOnboardData({
                      ...onboardData,
                      hobbiesPersonal: e.target.value,
                    })
                  }
                />
              </div>

              <button type="submit" className="complete-profile-btn">
                Verify & Save
              </button>
            </div>
          </form>
        </div>
      ) : isEditing ? (
        <EditProfile
          user={user}
          ref={formRef}
          onCancel={() => setIsEditing(false)}
          onUpdate={(updated) => {
            setUser(updated);
            setIsEditing(false);
          }}
        />
      ) : (
        <div className="profile-partition-wrapper">
          <div className="profile-card profile-view-wide">
            {/* 1. HEADER SECTION (Expanded) */}
            <div className="profile-view-header">
              <div className="avatar-side">
                <img
                  src={user.profilePhoto || '/default-avatar.png'}
                  className="profile-avatar"
                  alt="User"
                />
                <div
                  className={`status-pill ${
                    user.isApproved ? 'verified' : 'pending'
                  }`}
                >
                  {user.isApproved ? 'Verified Member' : 'Pending Verification'}
                </div>
              </div>

              <div className="identity-side">
                <h1>{user.displayName || user.name}</h1>
                <div className="badge-row">
                  <span className="info-badge role">
                    {user.role?.toUpperCase()}
                  </span>
                  <span className="info-badge branch">{user.branch}</span>
                  <span className="info-badge year">
                    Batch of {user.passoutYear}
                  </span>
                </div>

                <div className="header-links">
                  {user.linkedin && (
                    <a
                      href={ensureAbsoluteUrl(user.linkedin)}
                      target="_blank"
                      rel="noreferrer"
                      className="action-link"
                    >
                      LinkedIn ↗
                    </a>
                  )}
                  {user.resumeUrl && (
                    <a
                      href={user.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="action-link"
                    >
                      Resume ↗
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 2–4. GRID SECTIONS */}
            <div className="profile-view-grid">
              {/* 2. IDENTITY & CONTACT (Left Column) */}
              <div className="view-column">
                <h4 className="column-label">Identity & Contact</h4>
                <div className="data-box-grid">
                  <div className="data-row-flex">
                    <div className="data-field">
                      <label>Father&apos;s Name</label>
                      <div className="static-value">
                        {user.fatherName || '—'}
                      </div>
                    </div>
                    <div className="data-field">
                      <label>Date of Birth</label>
                      <div className="static-value">
                        {user.dob
                          ? new Date(user.dob).toLocaleDateString()
                          : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="data-row-flex">
                    <div className="data-field">
                      <label>Mobile</label>
                      <div className="static-value">
                        {user.mobile || '—'}
                      </div>
                    </div>
                    <div className="data-field">
                      <label>Email</label>
                      <div className="static-value email-val">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. ACADEMICS & INTERESTS (Right Column) */}
              <div className="view-column">
                <h4 className="column-label">Academic & Interests</h4>
                <div className="data-box-grid">
                  <div className="data-row-flex">
                    <div className="data-field">
                      <label>10th Year</label>
                      <div className="static-value">
                        {user.tenthYear || '—'}
                      </div>
                    </div>
                    <div className="data-field">
                      <label>12th Year</label>
                      <div className="static-value">
                        {user.twelfthYear || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="data-field">
                    <label>Technical Hobbies</label>
                    <div className="tag-group">
                      {user.hobbiesTechnical?.length > 0 ? (
                        user.hobbiesTechnical.map((h, i) => (
                          <span key={i} className="v-tag gold">
                            {h}
                          </span>
                        ))
                      ) : (
                        <span className="empty-text">
                          No technical tags added
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="data-field">
                    <label>Personal Hobbies</label>
                    <div className="tag-group">
                      {user.hobbiesPersonal?.length > 0 ? (
                        user.hobbiesPersonal.map((h, i) => (
                          <span key={i} className="v-tag violet">
                            {h}
                          </span>
                        ))
                      ) : (
                        <span className="empty-text">
                          No personal tags added
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. BIO & ADDRESSES (Full Width) */}
              <div className="view-column span-full">
                <h4 className="column-label">Professional Statement</h4>
                <div className="data-field full">
                  <div className="static-value bio-display">
                    {user.bio || 'No professional statement provided.'}
                  </div>
                </div>
              </div>

              <div className="view-column span-full">
                <h4 className="column-label">
                  Residential & Professional Registry
                </h4>

                <div className="data-row-flex">
                  <div className="data-field">
                    <label>Current Address</label>
                    <div className="static-value address-display">
                      {user.currentAddress || '—'}
                    </div>
                  </div>
                  <div className="data-field">
                    <label>Permanent Address</label>
                    <div className="static-value address-display">
                      {user.permanentAddress || '—'}
                    </div>
                  </div>
                </div>

                <div className="data-row-flex">
                  <div className="data-field">
                    <label>LinkedIn</label>
                    <div className="static-value">
                      {user.linkedin ? (
                        <a
                          href={ensureAbsoluteUrl(user.linkedin)}
                          target="_blank"
                          rel="noreferrer"
                          className="action-link"
                        >
                          External Profile ↗
                        </a>
                      ) : (
                        'Not Linked'
                      )}
                    </div>
                  </div>

                  <div className="data-field">
                    <label>Resume</label>
                    <div className="static-value">
                      {user.resumeUrl ? (
                        <a
                          href={user.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="action-link"
                        >
                          Download PDF ↗
                        </a>
                      ) : (
                        'Not Uploaded'
                      )}
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