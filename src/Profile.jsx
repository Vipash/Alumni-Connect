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

  const calculateCompletion = (user) => {
  const fields = [
    'displayName', 'bio', 'mobile', 'linkedin', 'resumeUrl', 
    'profilePhoto', 'fatherName', 'dob', 'tenthYear', 'twelfthYear', 
    'currentAddress', 'permanentAddress'
  ];
  const filledFields = fields.filter(field => user[field] && user[field] !== "");
  return Math.round((filledFields.length / fields.length) * 100);
};

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
const getProfileStatus = (user) => {
    const fieldMapping = {
      displayName: 'Display Name',
      bio: 'Professional Bio',
      mobile: 'Mobile Number',
      linkedin: 'LinkedIn Link',
      resumeUrl: 'Resume File',
      profilePhoto: 'Profile Photo',
      fatherName: 'Father\'s Name',
      dob: 'Date of Birth',
      tenthYear: '10th Year',
      twelfthYear: '12th Year',
      currentAddress: 'Current Address',
      permanentAddress: 'Permanent Address'
    };
    
    const missing = Object.keys(fieldMapping).filter(field => !user[field] || user[field] === "");
    const completion = Math.round(((Object.keys(fieldMapping).length - missing.length) / Object.keys(fieldMapping).length) * 100);
    
    return { 
      percentage: completion, 
      missingNames: missing.map(key => fieldMapping[key]) 
    };
  };

  const status = getProfileStatus(user);

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="avatar-wrapper">
          <img 
            src={user.profilePhoto || "/default-avatar.png"} 
            alt="Profile" 
            onError={(e) => { e.target.src = "/default-avatar.png"; }}
            className="profile-avatar"
          />
        </div>
        <div className="header-text">
          <h1>{user.displayName || user.name}</h1>
          <p className="user-role-tag">{user.role.toUpperCase()}</p>
          
          {/* Progress Bar with Hover Info */}
          <div className="progress-container" title={status.missingNames.length > 0 ? `Missing: ${status.missingNames.join(', ')}` : "Profile Complete!"}>
            <div className="progress-label">
              Profile Completion: {status.percentage}% 
              <span className="info-icon"> ⓘ</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${status.percentage}%` }}></div>
            </div>
            {status.missingNames.length > 0 && (
               <div className="missing-fields-tooltip">
                 <strong>To reach 100%, add:</strong>
                 <ul>{status.missingNames.slice(0, 3).map(name => <li key={name}>{name}</li>)}</ul>
                 {status.missingNames.length > 3 && <li>...and {status.missingNames.length - 3} more</li>}
               </div>
            )}
          </div>

          <div className="social-links" style={{marginTop: '15px'}}>
            {user.linkedin && (
              <a href={user.linkedin} target="_blank" rel="noreferrer" className="social-icon linkedin">
                LinkedIn 🔗
              </a>
            )}
            {/* RE-ADDED RESUME BUTTON */}
            {user.resumeUrl ? (
              <a href={user.resumeUrl} download target="_blank" rel="noopener noreferrer" className="social-icon resume-btn">
                Download Resume 📄
              </a>
            ) : (
              <span className="social-icon disabled">No Resume Uploaded</span>
            )}
          </div>
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
          <h4 className="row-title">Contact Addresses</h4>
          <div className="address-grid">
            <div className="info-item">
              <label>Current Address</label>
              <p className="address-text">{user.currentAddress}</p>
            </div>
            <div className="info-item">
              <label>Permanent Address</label>
              <p className="address-text">{user.permanentAddress}</p>
            </div>
          </div>
        </section>

        {/* ROW 5: HOBBIES */}
        <section className="profile-row-group" style={{borderBottom: 'none'}}>
          <h4 className="row-title">Interests & Skills</h4>
          <div className="hobbies-container">
            <div className="hobby-block">
              <label>Technical Hobbies</label>
              <div className="tags">
                {user.hobbiesTechnical?.map(h => <span key={h} className="tag tech-tag">{h}</span>)}
              </div>
            </div>
            <div className="hobby-block" style={{marginTop: '10px'}}>
              <label>Personal Hobbies</label>
              <div className="tags">
                {user.hobbiesPersonal?.map(h => <span key={h} className="tag personal-tag">{h}</span>)}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="profile-footer" style={{textAlign: 'center', padding: '20px'}}>
        <button className="complete-profile-btn" style={{width: 'auto', padding: '12px 40px'}} onClick={() => setIsEditing(true)}>
          Edit Profile Details
        </button>
      </div>
    </div>
  );
}

export default Profile;