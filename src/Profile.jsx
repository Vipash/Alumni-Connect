import { useState } from 'react';
import EditProfile from './EditProfile';

function Profile({ user, setUser }) { // Pass setUser to update parent
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return <div className="profile-container"><p>Loading profile...</p></div>;
  }
  
  if (isEditing) {
    return <EditProfile user={user} onCancel={() => setIsEditing(false)} onUpdate={(updated) => { setUser(updated); setIsEditing(false); }} />;
  }

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      <div className="profile-photo">
        <img src={user.profilePhoto || "/default-avatar.png"} alt="Profile" />
      </div>

      <div className="profile-grid">
        <div className="info-group">
          <label>Display Name</label>
          <p>{user.displayName || user.name}</p>
        </div>
        <div className="info-group">
          <label>Email</label>
          <p>{user.email}</p>
        </div>
        <div className="info-group">
          <label>Branch</label>
          <p>{user.branch}</p>
        </div>
        <div className="info-group">
          <label>Passout Year</label>
          <p>{user.passoutYear}</p>
        </div>

        {user.role === 'alumni' ? (
          <div className="info-group">
            <label>Current Company</label>
            <p>{user.company || "Not Specified"}</p>
          </div>
        ) : (
          <div className="info-group">
            <label>Roll Number</label>
            <p>{user.rollNumber || "N/A"}</p>
          </div>
        )}
        
        <div className="info-group">
          <label>Mobile</label>
          <p>{user.mobile}</p>
        </div>

        {/* New Optional Fields - Now inside profile-grid */}
        {user.bio && (
          <div className="info-group">
            <label>Bio</label>
            <p>{user.bio}</p>
          </div>
        )}
        
        {user.linkedin && (
          <div className="info-group">
            <label>LinkedIn</label>
            <p><a href={user.linkedin} target="_blank" rel="noreferrer">View Profile</a></p>
          </div>
        )}
        
        {user.resumeUrl && (
          <div className="info-group">
            <label>Resume</label>
            <p><a href={user.resumeUrl} target="_blank" rel="noreferrer">Download Resume</a></p>
          </div>
        )}
      </div> {/* Close profile-grid */}
    <button onClick={() => setIsEditing(true)}>Edit Profile</button>
    </div>
  );
}

export default Profile;