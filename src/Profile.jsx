import { useState } from 'react';
import EditProfile from './EditProfile';


function Profile({ user, setUser }) {
  const [isEditing, setIsEditing] = useState(false);

  if (!user) return <div className="profile-container">Loading...</div>;

  if (isEditing) {
    return <EditProfile user={user} onCancel={() => setIsEditing(false)} onUpdate={(updated) => { setUser(updated); setIsEditing(false); }} />;
  }
  console.log("DEBUG: Current User Photo URL:", user.profilePhoto);

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="avatar-wrapper">
          <div className="profile-photo">
  <img 
    src={user.profilePhoto || "/default-avatar.png"} 
    alt="Profile" 
    onError={(e) => { e.target.src = "/default-avatar.png"; }} // Fallback if link breaks
    style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
  />
</div>
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
  <div className="info-item">
    <label>Resume</label>
    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
      {/* VIEW BUTTON */}
      <a 
        href={user.resumeUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        type="application/pdf"
        className="social-icon"
        style={{ background: '#0077b5', color: 'white', padding: '8px 15px', borderRadius: '4px', textDecoration: 'none', fontSize: '14px' }}
      >
        View PDF 👁️
      </a>
      
      {/* DOWNLOAD BUTTON */}
      <a 
        href={user.resumeUrl.replace('/upload/', '/upload/fl_attachment/')} 
        className="social-icon"
        style={{ background: '#28a745', color: 'white', padding: '8px 15px', borderRadius: '4px', textDecoration: 'none', fontSize: '14px' }}
      >
        Download ⬇️
      </a>
    </div>
  </div>
)}
          </div>
        </div>
      </div>

      <div className="profile-body">
        <section className="profile-section">
          <h3>About Me</h3>
          <p className="bio-text">{user.bio || "No bio added yet. Tell us about yourself!"}</p>
        </section>

        <section className="profile-section grid-info">
          <div className="info-item">
            <label>Email</label>
            <span>{user.email}</span>
          </div>
          <div className="info-item">
            <label>Branch</label>
            <span>{user.branch}</span>
          </div>
          <div className="info-item">
            <label>Batch</label>
            <span>Class of {user.passoutYear}</span>
          </div>
          <div className="info-item">
            <label>Contact</label>
            <span>{user.mobile}</span>
          </div>
          {user.role === 'alumni' && (
            <div className="info-item">
              <label>Current Company</label>
              <span>{user.company || "Not Specified"}</span>
            </div>
          )}
        </section>
      </div>

      <div className="profile-footer">
        <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
          Edit Profile
        </button>
      </div>
    </div>
  );
}

export default Profile;